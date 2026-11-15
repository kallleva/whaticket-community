import { format } from "date-fns";
import { logger } from "../../utils/logger";
import Whatsapp from "../../models/Whatsapp";
import TestDrive from "../../models/TestDrive";
import { whatsappProvider } from "../../providers/WhatsApp";

const resolveWhatsappId = async (testDrive: TestDrive): Promise<number | null> => {
  if (testDrive.ticket?.whatsappId) {
    return testDrive.ticket.whatsappId;
  }

  const connected = await Whatsapp.findOne({ where: { status: "CONNECTED" } });
  return connected?.id ?? null;
};

// Confirmação pro cliente ao agendar/alterar o test-drive.
export const sendTestDriveMessageToContact = async (
  testDrive: TestDrive,
  body: string
): Promise<void> => {
  if (!testDrive.contact?.number) return;

  const whatsappId = await resolveWhatsappId(testDrive);
  if (!whatsappId) return;

  try {
    await whatsappProvider.sendMessage(
      whatsappId,
      `${testDrive.contact.number}@c.us`,
      body
    );
  } catch (error) {
    logger.error("Error sending test drive message to contact:", error);
  }
};

// Avisa o vendedor responsável (número pessoal cadastrado em Users.number).
export const sendTestDriveMessageToSalesperson = async (
  testDrive: TestDrive,
  body: string
): Promise<void> => {
  if (!testDrive.user?.number) return;

  const whatsappId = await resolveWhatsappId(testDrive);
  if (!whatsappId) return;

  try {
    await whatsappProvider.sendMessage(
      whatsappId,
      `${testDrive.user.number}@c.us`,
      body
    );
  } catch (error) {
    logger.error("Error sending test drive message to salesperson:", error);
  }
};

export const formatTestDriveDate = (date: Date): string =>
  format(date, "dd/MM/yyyy 'às' HH:mm");
