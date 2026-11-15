import ShowTestDriveService from "./ShowTestDriveService";

const DeleteTestDriveService = async (
  testDriveId: number | string
): Promise<void> => {
  const testDrive = await ShowTestDriveService(testDriveId);

  await testDrive.destroy();
};

export default DeleteTestDriveService;
