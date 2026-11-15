import * as Yup from "yup";
import AppError from "../../errors/AppError";
import TestDrive from "../../models/TestDrive";
import ShowTestDriveService from "./ShowTestDriveService";
import {
  sendTestDriveMessageToContact,
  formatTestDriveDate
} from "./sendTestDriveWhatsAppMessage";

interface Request {
  contactId: number;
  vehicleId?: number;
  userId?: number;
  ticketId?: number;
  scheduledAt: Date;
  notes?: string;
}

const CreateTestDriveService = async (data: Request): Promise<TestDrive> => {
  const schema = Yup.object().shape({
    contactId: Yup.number().required("ERR_TEST_DRIVE_INVALID_CONTACT"),
    scheduledAt: Yup.date().required("ERR_TEST_DRIVE_INVALID_DATE")
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  const created = await TestDrive.create(data as any);
  const testDrive = await ShowTestDriveService(created.id);

  const body = `✅ Test-drive confirmado para ${formatTestDriveDate(
    new Date(testDrive.scheduledAt)
  )}${testDrive.vehicle ? ` — ${testDrive.vehicle.brand} ${testDrive.vehicle.model}` : ""}. Até breve!`;

  await sendTestDriveMessageToContact(testDrive, body);

  return testDrive;
};

export default CreateTestDriveService;
