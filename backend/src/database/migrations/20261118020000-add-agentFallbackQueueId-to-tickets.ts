import { QueryInterface, DataTypes } from "sequelize";

// Fila de handoff escolhida no próprio node "Transferir p/ Agente IA" do
// funil (sobrepõe, só para este ticket, a fila padrão configurada no
// Agente) — precisa ficar no ticket porque, quando o handoff acontece, o
// node do funil que originou a transferência já não existe mais no
// contexto de execução.
module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Tickets", "agentFallbackQueueId", {
      type: DataTypes.INTEGER,
      references: { model: "Queues", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
      allowNull: true
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Tickets", "agentFallbackQueueId");
  }
};
