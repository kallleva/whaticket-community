import { Sequelize } from "sequelize";
import { logger } from "../../utils/logger";
import Contact from "../../models/Contact";
import BirthdayMessageQueue from "../../models/BirthdayMessageQueue";
import Setting from "../../models/Setting";
import formatBody from "../../helpers/Mustache";

const DEFAULT_TEMPLATE =
  "Parabéns, {{name}}! 🎉 A equipe da nossa concessionária deseja um feliz aniversário e muito sucesso!";

const GenerateBirthdayQueueJob = async (): Promise<void> => {
  try {
    const today = new Date();
    const todayMonthDay = `${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(today.getDate()).padStart(2, "0")}`;

    const contacts = await Contact.findAll({
      where: Sequelize.where(
        Sequelize.fn(
          "DATE_FORMAT",
          Sequelize.col("birthDate"),
          "%m-%d"
        ),
        todayMonthDay
      )
    });

    if (contacts.length === 0) {
      return;
    }

    const templateSetting = await Setting.findOne({
      where: { key: "birthdayMessageTemplate" }
    });
    const template = templateSetting?.value || DEFAULT_TEMPLATE;

    for (const contact of contacts) {
      const messageBody = formatBody(template, contact);

      // eslint-disable-next-line no-await-in-loop
      await BirthdayMessageQueue.findOrCreate({
        where: { contactId: contact.id, referenceDate: today },
        defaults: {
          contactId: contact.id,
          referenceDate: today,
          messageBody,
          status: "pending"
        }
      });
    }
  } catch (error) {
    logger.error("Error generating birthday message queue:", error);
  }
};

export default GenerateBirthdayQueueJob;
