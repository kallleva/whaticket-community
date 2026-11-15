import Agent from "../../models/Agent";

const ListAgentsService = async (): Promise<Agent[]> => {
  const agents = await Agent.findAll({
    include: ["fallbackQueue"],
    order: [["name", "ASC"]]
  });

  return agents;
};

export default ListAgentsService;
