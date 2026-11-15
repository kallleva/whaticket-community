import { Request, Response } from "express";
import { getIO } from "../libs/socket";

import ListVehiclesService from "../services/VehicleServices/ListVehiclesService";
import ShowVehicleService from "../services/VehicleServices/ShowVehicleService";
import CreateVehicleService from "../services/VehicleServices/CreateVehicleService";
import UpdateVehicleService from "../services/VehicleServices/UpdateVehicleService";
import DeleteVehicleService from "../services/VehicleServices/DeleteVehicleService";

type IndexQuery = {
  searchParam?: string;
  status?: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, status } = req.query as IndexQuery;

  const vehicles = await ListVehiclesService({ searchParam, status });

  return res.status(200).json(vehicles);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { vehicleId } = req.params;

  const vehicle = await ShowVehicleService(vehicleId);

  return res.status(200).json(vehicle);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const vehicle = await CreateVehicleService(req.body);

  const io = getIO();
  io.emit("vehicle", { action: "update", vehicle });

  return res.status(200).json(vehicle);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { vehicleId } = req.params;

  const vehicle = await UpdateVehicleService(vehicleId, req.body);

  const io = getIO();
  io.emit("vehicle", { action: "update", vehicle });

  return res.status(200).json(vehicle);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { vehicleId } = req.params;

  await DeleteVehicleService(vehicleId);

  const io = getIO();
  io.emit("vehicle", { action: "delete", vehicleId: +vehicleId });

  return res.status(200).send();
};
