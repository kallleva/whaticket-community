import AiProvider from "../../models/AiProvider";

// Nunca inclui apiKeyEncrypted na resposta — segue o padrão real deste
// projeto (ShowUserService) de restringir atributos explicitamente, já que
// não existe toJSON() escondendo campos sensíveis nos models.
const ShowAiProviderService = async (): Promise<AiProvider | null> => {
  const provider = await AiProvider.findOne({
    attributes: ["id", "name", "enabledModels", "createdAt", "updatedAt"]
  });

  return provider;
};

export default ShowAiProviderService;
