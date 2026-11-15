import ShowVehicleService from "./ShowVehicleService";

const DeleteVehicleService = async (vehicleId: number | string): Promise<void> => {
  const vehicle = await ShowVehicleService(vehicleId);

  await vehicle.destroy();
};

export default DeleteVehicleService;
