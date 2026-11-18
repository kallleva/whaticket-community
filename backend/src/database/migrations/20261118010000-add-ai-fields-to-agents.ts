import { QueryInterface, DataTypes } from "sequelize";

// Suporte a: provedor local/custom (LLM auto-hospedada tipo Qwen via Ollama),
// contexto estático extra, ferramentas (function calling) e respostas em
// áudio (TTS).
module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Agents", "providerType", {
      type: DataTypes.STRING,
      defaultValue: "gemini",
      allowNull: false
    });
    await queryInterface.addColumn("Agents", "apiUrl", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("Agents", "extraContext", {
      type: DataTypes.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn("Agents", "tools", {
      type: DataTypes.JSON,
      defaultValue: [],
      allowNull: true
    });
    await queryInterface.addColumn("Agents", "voiceReplies", {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Agents", "providerType");
    await queryInterface.removeColumn("Agents", "apiUrl");
    await queryInterface.removeColumn("Agents", "extraContext");
    await queryInterface.removeColumn("Agents", "tools");
    await queryInterface.removeColumn("Agents", "voiceReplies");
  }
};
