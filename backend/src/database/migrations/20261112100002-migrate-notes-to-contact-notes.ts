import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const contacts: Array<{ id: number; notes: string; updatedAt: Date }> =
      (await queryInterface.sequelize.query(
        `SELECT id, notes, updatedAt FROM Contacts WHERE notes IS NOT NULL AND notes <> ''`,
        { type: "SELECT" }
      )) as any;

    if (!contacts || contacts.length === 0) {
      return;
    }

    await Promise.all(
      contacts.map(contact =>
        queryInterface.bulkInsert("ContactNotes", [
          {
            note: contact.notes,
            contactId: contact.id,
            userId: null,
            createdAt: contact.updatedAt,
            updatedAt: contact.updatedAt
          }
        ])
      )
    );
  },

  down: async () => {
    // Dado migrado é histórico e não é revertido automaticamente.
  }
};
