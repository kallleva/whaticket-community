import { Op, Filterable } from "sequelize";
import Vehicle from "../../models/Vehicle";

interface Request {
  searchParam?: string;
  status?: string;
}

const ListVehiclesService = async ({
  searchParam,
  status
}: Request = {}): Promise<Vehicle[]> => {
  const where: Exclude<Filterable["where"], undefined> = {};

  if (status) {
    where.status = status;
  }

  if (searchParam) {
    where[Op.or as any] = [
      { brand: { [Op.like]: `%${searchParam}%` } },
      { model: { [Op.like]: `%${searchParam}%` } },
      { plate: { [Op.like]: `%${searchParam}%` } }
    ];
  }

  const vehicles = await Vehicle.findAll({
    where,
    order: [["brand", "ASC"], ["model", "ASC"]]
  });

  return vehicles;
};

export default ListVehiclesService;
