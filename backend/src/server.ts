import gracefulShutdown from "http-graceful-shutdown";
import app from "./app";
import { initIO } from "./libs/socket";
import { logger } from "./utils/logger";
import { StartAllWhatsAppsSessions } from "./services/WbotServices/StartAllWhatsAppsSessions";
import { whatsappProvider } from "./providers/WhatsApp";
import { initCron } from "./cron";

const server = app.listen(process.env.PORT, () => {
  logger.info(`Server started on port: ${process.env.PORT}`);
});

initIO(server);
StartAllWhatsAppsSessions();
initCron();
gracefulShutdown(server, {
  // Fecha todo Chrome/sessão aberta antes do processo morrer — sem isso,
  // um restart do container (deploy, docker compose restart etc.) deixa
  // o perfil do Chrome com lock travado, e a sessão seguinte sobe
  // corrompida (dois processos de Chrome brigando pelo mesmo userDataDir).
  onShutdown: async () => {
    try {
      await whatsappProvider.destroyAllSessions();
    } catch (err) {
      logger.error(err, "Error destroying whatsapp sessions on shutdown");
    }
  }
});

process.on("uncaughtException", err => {
  logger.error({ info: "Global uncaught exception", err });
});

process.on("unhandledRejection", err => {
  if (err) logger.error({ info: "Global unhandled rejection", err });
});
