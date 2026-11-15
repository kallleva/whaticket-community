import TestDrive from "../../models/TestDrive";
import ShowTestDriveService from "./ShowTestDriveService";
import {
  sendTestDriveMessageToContact,
  formatTestDriveDate
} from "./sendTestDriveWhatsAppMessage";

interface Request {
  scheduledAt?: Date;
  status?: string;
  vehicleId?: number | null;
  userId?: number | null;
  notes?: string;
}

const UpdateTestDriveService = async (
  testDriveId: number | string,
  data: Request
): Promise<TestDrive> => {
  const testDrive = await ShowTestDriveService(testDriveId);
  const previousScheduledAt = testDrive.scheduledAt;
  const previousStatus = testDrive.status;

  await testDrive.update({
    scheduledAt: data.scheduledAt ?? testDrive.scheduledAt,
    status: data.status ?? testDrive.status,
    vehicleId: data.vehicleId !== undefined ? data.vehicleId : testDrive.vehicleId,
    userId: data.userId !== undefined ? data.userId : testDrive.userId,
    notes: data.notes ?? testDrive.notes,
    // Reagendou: o lembrete antigo não vale mais pro novo horário.
    reminderSentAt:
      data.scheduledAt &&
      new Date(data.scheduledAt).getTime() !== new Date(previousScheduledAt).getTime()
        ? null
        : testDrive.reminderSentAt
  });

  const updated = await ShowTestDriveService(testDriveId);

  const rescheduled =
    data.scheduledAt &&
    new Date(data.scheduledAt).getTime() !== new Date(previousScheduledAt).getTime();

  if (rescheduled) {
    await sendTestDriveMessageToContact(
      updated,
      `🔁 Seu test-drive foi reagendado para ${formatTestDriveDate(
        new Date(updated.scheduledAt)
      )}.`
    );
  } else if (data.status === "cancelled" && previousStatus !== "cancelled") {
    await sendTestDriveMessageToContact(
      updated,
      "❌ Seu test-drive foi cancelado. Qualquer coisa, é só chamar!"
    );
  }

  return updated;
};

export default UpdateTestDriveService;
