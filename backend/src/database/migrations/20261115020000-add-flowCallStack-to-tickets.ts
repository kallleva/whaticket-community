import { QueryInterface, DataTypes } from "sequelize";

// Pilha de retorno para o node "call_flow" (chamar outro funil e, quando
// ele terminar num "end", voltar a executar a partir de onde parou no
// funil chamador) — [{flowId, returnNodeId}], do mais externo pro mais
// interno.
module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Tickets", "flowCallStack", {
      type: DataTypes.JSON,
      defaultValue: [],
      allowNull: true
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Tickets", "flowCallStack");
  }
};
