import AppError from "../../errors/AppError";
import Vehicle from "../../models/Vehicle";

const ShowVehicleService = async (vehicleId: number | string): Promise<Vehicle> => {
  const vehicle = await Vehicle.findByPk(vehicleId);

  if (!vehicle) {
    throw new AppError("ERR_VEHICLE_NOT_FOUND", 404);
  }

  return vehicle;
};

export default ShowVehicleService;
