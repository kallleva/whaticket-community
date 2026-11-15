import AppError from "../../errors/AppError";
import TestDrive from "../../models/TestDrive";

const ShowTestDriveService = async (
  testDriveId: number | string
): Promise<TestDrive> => {
  const testDrive = await TestDrive.findByPk(testDriveId, {
    include: ["contact", "vehicle", "user"]
  });

  if (!testDrive) {
    throw new AppError("ERR_TEST_DRIVE_NOT_FOUND", 404);
  }

  return testDrive;
};

export default ShowTestDriveService;
