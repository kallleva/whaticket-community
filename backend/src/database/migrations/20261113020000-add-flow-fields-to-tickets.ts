import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Tickets", "flowId", {
      type: DataTypes.INTEGER,
      references: { model: "Flows", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
      allowNull: true
    });
    await queryInterface.addColumn("Tickets", "flowNodeId", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("Tickets", "flowVariables", {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    });
    await queryInterface.addColumn("Tickets", "flowResumeAt", {
      type: DataTypes.DATE,
      allowNull: true
    });
    await queryInterface.addColumn("Tickets", "aiAgentId", {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    await queryInterface.addIndex("Tickets", {
      fields: ["flowResumeAt"],
      name: "tickets_flow_resume_at_idx"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeIndex("Tickets", "tickets_flow_resume_at_idx");
    await queryInterface.removeColumn("Tickets", "aiAgentId");
    await queryInterface.removeColumn("Tickets", "flowResumeAt");
    await queryInterface.removeColumn("Tickets", "flowVariables");
    await queryInterface.removeColumn("Tickets", "flowNodeId");
    await queryInterface.removeColumn("Tickets", "flowId");
  }
};
