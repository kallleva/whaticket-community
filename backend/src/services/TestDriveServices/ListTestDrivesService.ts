import { Op, Filterable } from "sequelize";
import TestDrive from "../../models/TestDrive";

interface Request {
  startDate?: string;
  endDate?: string;
  userId?: string;
}

const ListTestDrivesService = async ({
  startDate,
  endDate,
  userId
}: Request = {}): Promise<TestDrive[]> => {
  const where: Exclude<Filterable["where"], undefined> = {};

  if (startDate && endDate) {
    where.scheduledAt = {
      [Op.between]: [+new Date(startDate), +new Date(endDate)]
    };
  }

  if (userId) {
    where.userId = userId;
  }

  const testDrives = await TestDrive.findAll({
    where,
    include: ["contact", "vehicle", "user"],
    order: [["scheduledAt", "ASC"]]
  });

  return testDrives;
};

export default ListTestDrivesService;
