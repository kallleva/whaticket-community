import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Vehicle from "../../models/Vehicle";

interface Request {
  brand: string;
  model: string;
  version?: string;
  year?: number;
  color?: string;
  plate?: string;
  status?: string;
  price?: number;
  photoUrl?: string;
}

const CreateVehicleService = async (vehicleData: Request): Promise<Vehicle> => {
  const schema = Yup.object().shape({
    brand: Yup.string().required("ERR_VEHICLE_INVALID_BRAND"),
    model: Yup.string().required("ERR_VEHICLE_INVALID_MODEL")
  });

  try {
    await schema.validate(vehicleData);
  } catch (err) {
    throw new AppError(err.message);
  }

  const vehicle = await Vehicle.create(vehicleData as any);

  return vehicle;
};

export default CreateVehicleService;
