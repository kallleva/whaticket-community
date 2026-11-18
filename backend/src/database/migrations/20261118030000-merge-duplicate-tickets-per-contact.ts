import { QueryInterface, QueryTypes } from "sequelize";

// Um contato (número) passa a ter UM único ticket pra sempre (ver
// FindOrCreateTicketService). Esta migration unifica os duplicados que já
// existem: escolhe um ticket "principal" por contato (prefere o que tem
// agente de IA/funil em andamento, depois o mais recentemente atualizado),
// move TODAS as mensagens/lembretes/test-drives dos outros pra ele e só
// então remove os tickets vazios que sobraram — nenhuma mensagem se perde.
module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const { sequelize } = queryInterface;

    const duplicated = await sequelize.query<{ contactId: number }>(
      "SELECT contactId FROM Tickets GROUP BY contactId HAVING COUNT(*) > 1",
      { type: QueryTypes.SELECT }
    );

    for (const { contactId } of duplicated) {
      // eslint-disable-next-line no-await-in-loop
      const tickets = await sequelize.query<{ id: number; whatsappId: number | null }>(
        `SELECT id, whatsappId FROM Tickets WHERE contactId = :contactId
         ORDER BY (aiAgentId IS NOT NULL) DESC, (flowNodeId IS NOT NULL) DESC,
                  updatedAt DESC, id DESC`,
        { replacements: { contactId }, type: QueryTypes.SELECT }
      );

      const [canonical, ...others] = tickets;
      const otherIds = others.map(t => t.id);
      const fallbackWhatsappId =
        tickets.find(t => t.whatsappId !== null)?.whatsappId ?? null;

      // eslint-disable-next-line no-await-in-loop
      await sequelize.transaction(async transaction => {
        const params = { replacements: { canonicalId: canonical.id, otherIds }, transaction };

        await sequelize.query(
          "UPDATE Messages SET ticketId = :canonicalId WHERE ticketId IN (:otherIds)",
          params
        );
        await sequelize.query(
          "UPDATE Reminders SET ticketId = :canonicalId WHERE ticketId IN (:otherIds)",
          params
        );
        await sequelize.query(
          "UPDATE TestDrives SET ticketId = :canonicalId WHERE ticketId IN (:otherIds)",
          params
        );
        await sequelize.query(
          `UPDATE Tickets SET whatsappId = COALESCE(whatsappId, :fallbackWhatsappId)
           WHERE id = :canonicalId`,
          {
            replacements: { canonicalId: canonical.id, fallbackWhatsappId },
            transaction
          }
        );
        await sequelize.query("DELETE FROM Tickets WHERE id IN (:otherIds)", params);
      });
    }
  },

  down: async () => {
    // Irreversível: os tickets duplicados foram unificados (nenhuma
    // mensagem foi perdida, só reagrupada num único ticket por contato).
  }
};
