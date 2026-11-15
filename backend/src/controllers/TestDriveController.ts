import { Request, Response } from "express";
import { getIO } from "../libs/socket";

import ListTestDrivesService from "../services/TestDriveServices/ListTestDrivesService";
import ShowTestDriveService from "../services/TestDriveServices/ShowTestDriveService";
import CreateTestDriveService from "../services/TestDriveServices/CreateTestDriveService";
import UpdateTestDriveService from "../services/TestDriveServices/UpdateTestDriveService";
import DeleteTestDriveService from "../services/TestDriveServices/DeleteTestDriveService";

type IndexQuery = {
  startDate?: string;
  endDate?: string;
  userId?: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { startDate, endDate, userId } = req.query as IndexQuery;

  const testDrives = await ListTestDrivesService({ startDate, endDate, userId });

  return res.status(200).json(testDrives);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { testDriveId } = req.params;

  const testDrive = await ShowTestDriveService(testDriveId);

  return res.status(200).json(testDrive);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { contactId, vehicleId, userId, ticketId, scheduledAt, notes } = req.body;

  const testDrive = await CreateTestDriveService({
    contactId,
    vehicleId,
    userId: userId || +req.user.id,
    ticketId,
    scheduledAt,
    notes
  });

  const io = getIO();
  io.emit("testDrive", { action: "update", testDrive });

  return res.status(200).json(testDrive);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { testDriveId } = req.params;

  const testDrive = await UpdateTestDriveService(testDriveId, req.body);

  const io = getIO();
  io.emit("testDrive", { action: "update", testDrive });

  return res.status(200).json(testDrive);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { testDriveId } = req.params;

  await DeleteTestDriveService(testDriveId);

  const io = getIO();
  io.emit("testDrive", { action: "delete", testDriveId: +testDriveId });

  return res.status(200).send();
};
