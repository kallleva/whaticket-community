import { QueryInterface, DataTypes } from "sequelize";

// "Carteira de cliente": o primeiro vendedor atribuído a um contato passa a
// ser o dono dele — mensagens futuras desse contato caem direto pra esse
// vendedor, em vez de round robin, mesmo depois do ticket ser resolvido.
module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Contacts", "ownerId", {
      type: DataTypes.INTEGER,
      references: { model: "Users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
      allowNull: true
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Contacts", "ownerId");
  }
};
