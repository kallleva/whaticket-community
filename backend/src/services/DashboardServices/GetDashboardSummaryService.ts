import { Op, Sequelize } from "sequelize";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import Contact from "../../models/Contact";
import TestDrive from "../../models/TestDrive";
import Reminder from "../../models/Reminder";
import Ticket from "../../models/Ticket";
import Vehicle from "../../models/Vehicle";
import User from "../../models/User";

interface Request {
  userId: number;
  profile: string;
}

interface PersonalSummary {
  myRemindersToday: number;
  myTestDrivesToday: number;
  myOwnedContactsCount: number;
  myWonThisMonth: number;
}

interface AdminSummary extends PersonalSummary {
  leadsByStatus: Record<string, number>;
  leadsByStage: Record<string, number>;
  testDrivesToday: number;
  testDrivesThisWeek: number;
  remindersDueToday: number;
  remindersOverdue: number;
  vehiclesAvailable: number;
  vehiclesSold: number;
  topSalespeople: { userId: number; name: string; ticketsThisMonth: number; wonThisMonth: number }[];
}

const between = (start: Date, end: Date) => ({ [Op.between]: [+start, +end] });
const notNull = { [Op.not]: null } as unknown as string;

const countBy = async (
  model: typeof Contact,
  column: "leadStatus" | "pipelineStage"
): Promise<Record<string, number>> => {
  const rows = await model.findAll({
    attributes: [column, [Sequelize.fn("COUNT", Sequelize.col("id")), "count"]],
    where: { [column]: notNull },
    group: [column],
    raw: true
  });

  return rows.reduce((acc: Record<string, number>, row: any) => {
    acc[row[column]] = Number(row.count);
    return acc;
  }, {});
};

const getPersonalSummary = async (userId: number): Promise<PersonalSummary> => {
  const now = new Date();

  const [myRemindersToday, myTestDrivesToday, myOwnedContactsCount, myWonThisMonth] =
    await Promise.all([
      Reminder.count({
        where: {
          userId,
          status: "pending",
          dueDate: between(startOfDay(now), endOfDay(now))
        }
      }),
      TestDrive.count({
        where: {
          userId,
          scheduledAt: between(startOfDay(now), endOfDay(now))
        }
      }),
      Contact.count({ where: { ownerId: userId } }),
      Contact.count({
        where: {
          ownerId: userId,
          leadStatus: "won",
          updatedAt: between(startOfMonth(now), endOfMonth(now))
        }
      })
    ]);

  return { myRemindersToday, myTestDrivesToday, myOwnedContactsCount, myWonThisMonth };
};

const GetDashboardSummaryService = async ({
  userId,
  profile
}: Request): Promise<PersonalSummary | AdminSummary> => {
  const personal = await getPersonalSummary(userId);

  if (profile !== "admin") {
    return personal;
  }

  const now = new Date();

  const [
    leadsByStatus,
    leadsByStage,
    testDrivesToday,
    testDrivesThisWeek,
    remindersDueToday,
    remindersOverdue,
    vehiclesAvailable,
    vehiclesSold,
    ticketsThisMonthByUser,
    wonThisMonthByUser,
    users
  ] = await Promise.all([
    countBy(Contact, "leadStatus"),
    countBy(Contact, "pipelineStage"),
    TestDrive.count({
      where: { scheduledAt: between(startOfDay(now), endOfDay(now)) }
    }),
    TestDrive.count({
      where: { scheduledAt: between(startOfWeek(now), endOfWeek(now)) }
    }),
    Reminder.count({
      where: { status: "pending", dueDate: between(startOfDay(now), endOfDay(now)) }
    }),
    Reminder.count({
      where: { status: "pending", dueDate: { [Op.lt]: +startOfDay(now) } }
    }),
    Vehicle.count({ where: { status: "available" } }),
    Vehicle.count({ where: { status: "sold" } }),
    Ticket.findAll({
      attributes: ["userId", [Sequelize.fn("COUNT", Sequelize.col("Ticket.id")), "count"]],
      where: {
        userId: notNull,
        createdAt: between(startOfMonth(now), endOfMonth(now))
      },
      group: ["userId"],
      raw: true
    }),
    Contact.findAll({
      attributes: ["ownerId", [Sequelize.fn("COUNT", Sequelize.col("Contact.id")), "count"]],
      where: {
        ownerId: notNull,
        leadStatus: "won",
        updatedAt: between(startOfMonth(now), endOfMonth(now))
      },
      group: ["ownerId"],
      raw: true
    }),
    User.findAll({ attributes: ["id", "name"], raw: true })
  ]);

  const userNameById = new Map(users.map((u: any) => [u.id, u.name]));
  const ticketsByUserId = new Map(
    (ticketsThisMonthByUser as any[]).map(r => [r.userId, Number(r.count)])
  );
  const wonByUserId = new Map(
    (wonThisMonthByUser as any[]).map(r => [r.ownerId, Number(r.count)])
  );

  const salespersonIds = new Set([...ticketsByUserId.keys(), ...wonByUserId.keys()]);

  const topSalespeople = Array.from(salespersonIds)
    .map(id => ({
      userId: id,
      name: userNameById.get(id) || `Usuário #${id}`,
      ticketsThisMonth: ticketsByUserId.get(id) || 0,
      wonThisMonth: wonByUserId.get(id) || 0
    }))
    .sort((a, b) => b.wonThisMonth - a.wonThisMonth || b.ticketsThisMonth - a.ticketsThisMonth)
    .slice(0, 5);

  return {
    ...personal,
    leadsByStatus,
    leadsByStage,
    testDrivesToday,
    testDrivesThisWeek,
    remindersDueToday,
    remindersOverdue,
    vehiclesAvailable,
    vehiclesSold,
    topSalespeople
  };
};

export default GetDashboardSummaryService;
