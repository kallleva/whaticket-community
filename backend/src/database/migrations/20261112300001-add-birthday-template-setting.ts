import { QueryInterface } from "sequelize";

const DEFAULT_TEMPLATE =
  "Parabéns, {{name}}! 🎉 A equipe da nossa concessionária deseja um feliz aniversário e muito sucesso!";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.bulkInsert(
      "Settings",
      [
        {
          key: "birthdayMessageTemplate",
          value: DEFAULT_TEMPLATE,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      {}
    );
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.bulkDelete("Settings", {
      key: "birthdayMessageTemplate"
    });
  }
};
