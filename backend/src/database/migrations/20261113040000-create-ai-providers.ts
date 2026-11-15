import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("AiProviders", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Google Gemini"
      },
      apiKeyEncrypted: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      enabledModels: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
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
    return queryInterface.dropTable("AiProviders");
  }
};
