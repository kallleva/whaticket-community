import { Op, literal } from "sequelize";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import Message from "../../models/Message";

// Contatos "fantasma": vêm do getContacts() do WhatsApp Web, que inclui
// identificadores internos (LID) em vez de números de telefone reais —
// sempre com nome igual ao número e nunca trocaram mensagem.
const ghostWhere = {
  [Op.and]: [
    literal("LENGTH(`Contact`.`number`) >= 14"),
    literal("`Contact`.`name` = `Contact`.`number`")
  ]
};

const findGhostContactIds = async (): Promise<number[]> => {
  const contacts = await Contact.findAll({
    where: ghostWhere,
    attributes: ["id"],
    include: [
      { model: Ticket, as: "tickets", attributes: ["id"], required: false },
    ]
  });

  const candidateIds = contacts
    .filter(c => (c as any).tickets.length === 0)
    .map(c => c.id);

  if (candidateIds.length === 0) return [];

  const idsWithMessages = await Message.findAll({
    where: { contactId: { [Op.in]: candidateIds } },
    attributes: ["contactId"],
    group: ["contactId"]
  });
  const idsWithMessagesSet = new Set(idsWithMessages.map(m => m.contactId));

  return candidateIds.filter(id => !idsWithMessagesSet.has(id));
};

export const previewGhostContacts = async (): Promise<{
  count: number;
  sample: { id: number; number: string }[];
}> => {
  const ids = await findGhostContactIds();
  const sample = await Contact.findAll({
    where: { id: { [Op.in]: ids.slice(0, 10) } },
    attributes: ["id", "number"]
  });

  return { count: ids.length, sample };
};

export const deleteGhostContacts = async (): Promise<number> => {
  const ids = await findGhostContactIds();
  if (ids.length === 0) return 0;

  await Contact.destroy({ where: { id: { [Op.in]: ids } } });
  return ids.length;
};
