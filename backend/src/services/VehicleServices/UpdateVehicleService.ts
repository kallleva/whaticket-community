import ShowVehicleService from "./ShowVehicleService";
import Vehicle from "../../models/Vehicle";

interface Request {
  brand?: string;
  model?: string;
  version?: string;
  year?: number;
  color?: string;
  plate?: string;
  status?: string;
  price?: number;
  photoUrl?: string;
}

const UpdateVehicleService = async (
  vehicleId: number | string,
  vehicleData: Request
): Promise<Vehicle> => {
  const vehicle = await ShowVehicleService(vehicleId);

  await vehicle.update({
    brand: vehicleData.brand ?? vehicle.brand,
    model: vehicleData.model ?? vehicle.model,
    version: vehicleData.version ?? vehicle.version,
    year: vehicleData.year ?? vehicle.year,
    color: vehicleData.color ?? vehicle.color,
    plate: vehicleData.plate ?? vehicle.plate,
    status: vehicleData.status ?? vehicle.status,
    price: vehicleData.price ?? vehicle.price,
    photoUrl: vehicleData.photoUrl ?? vehicle.photoUrl
  });

  return vehicle;
};

export default UpdateVehicleService;
