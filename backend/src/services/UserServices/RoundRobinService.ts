import { Op } from "sequelize";
import User from "../../models/User";
import Ticket from "../../models/Ticket";

const getNextUserForQueue = async (
  candidateUsers: User[]
): Promise<User | null> => {
  if (!candidateUsers || candidateUsers.length === 0) {
    return null;
  }

  const ticketCounts = await Promise.all(
    candidateUsers.map(async user => {
      const count = await Ticket.count({
        where: {
          userId: user.id,
          status: { [Op.or]: ["open", "pending"] }
        }
      });
      return { user, count };
    })
  );

  ticketCounts.sort((a, b) => a.count - b.count || a.user.id - b.user.id);

  return ticketCounts[0].user;
};

export default getNextUserForQueue;
