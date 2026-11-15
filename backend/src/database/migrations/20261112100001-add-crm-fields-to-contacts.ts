import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Contacts", "address", {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    });
    await queryInterface.addColumn("Contacts", "birthDate", {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: null
    });
    await queryInterface.addColumn("Contacts", "document", {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    });
    await queryInterface.addColumn("Contacts", "leadStatus", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "warm"
    });
    await queryInterface.addColumn("Contacts", "pipelineStage", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "lead"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Contacts", "address");
    await queryInterface.removeColumn("Contacts", "birthDate");
    await queryInterface.removeColumn("Contacts", "document");
    await queryInterface.removeColumn("Contacts", "leadStatus");
    await queryInterface.removeColumn("Contacts", "pipelineStage");
  }
};
