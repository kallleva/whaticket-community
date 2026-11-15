import AiProvider from "../../models/AiProvider";
import { encrypt } from "../../helpers/Encryption";
import ShowAiProviderService from "./ShowAiProviderService";

interface Request {
  name?: string;
  apiKey?: string;
  enabledModels?: string[];
}

const UpdateAiProviderService = async ({
  name,
  apiKey,
  enabledModels
}: Request): Promise<AiProvider> => {
  let provider = await AiProvider.findOne();

  if (!provider) {
    provider = await AiProvider.create({
      name: name || "Google Gemini",
      enabledModels: enabledModels || []
    });
  }

  await provider.update({
    name: name ?? provider.name,
    enabledModels: enabledModels ?? provider.enabledModels,
    // Chave vazia/não enviada mantém a anterior — não sobrescreve com vazio.
    apiKeyEncrypted: apiKey ? encrypt(apiKey) : provider.apiKeyEncrypted
  });

  return (await ShowAiProviderService()) as AiProvider;
};

export default UpdateAiProviderService;
