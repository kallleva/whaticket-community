import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("Agents", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      skillPrompt: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      model: {
        type: DataTypes.STRING,
        allowNull: false
      },
      temperature: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.7
      },
      handoffMarker: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "HUMANO_SOLICITADO"
      },
      fallbackQueueId: {
        type: DataTypes.INTEGER,
        references: { model: "Queues", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.dropTable("Agents");
  }
};
