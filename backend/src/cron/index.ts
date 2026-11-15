// IMPORTANTE: este agendador roda in-process (node-cron), sem Redis/Bull.
// Isso só é seguro com UMA ÚNICA instância do backend em execução: rodar
// múltiplas réplicas duplicaria notificações e envios de WhatsApp, pois não
// há lock distribuído entre processos.
import cron from "node-cron";
import { logger } from "../utils/logger";
import CheckDueRemindersJob from "../services/ReminderServices/CheckDueRemindersJob";
import GenerateBirthdayQueueJob from "../services/BirthdayServices/GenerateBirthdayQueueJob";
import ProcessDueFlowDelaysJob from "../services/FlowServices/ProcessDueFlowDelaysJob";
import SendTestDriveReminderJob from "../services/TestDriveServices/SendTestDriveReminderJob";

export const initCron = (): void => {
  cron.schedule("* * * * *", () => {
    CheckDueRemindersJob();
  });

  cron.schedule("0 7 * * *", () => {
    GenerateBirthdayQueueJob();
  });

  cron.schedule("*/10 * * * * *", () => {
    ProcessDueFlowDelaysJob();
  });

  cron.schedule("*/10 * * * *", () => {
    SendTestDriveReminderJob();
  });

  logger.info(
    "Cron jobs initialized (reminders every minute, birthdays at 07:00, flow delays every 10s, test-drive reminders every 10min)"
  );
};
