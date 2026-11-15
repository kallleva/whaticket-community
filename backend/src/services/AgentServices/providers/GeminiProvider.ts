import { GoogleGenerativeAI, Content } from "@google/generative-ai";

// Isolado atrás desta interface simples para a extensibilidade a outros
// provedores de IA (combinada com o usuário) ser viável depois sem
// precisar tocar em RunAiAgentTurnService.ts.
interface GenerateReplyParams {
  apiKey: string;
  model: string;
  systemInstruction: string;
  temperature: number;
  history: Content[];
  message: string;
}

const generateReply = async ({
  apiKey,
  model,
  systemInstruction,
  temperature,
  history,
  message
}: GenerateReplyParams): Promise<string> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const generativeModel = genAI.getGenerativeModel({
    model,
    systemInstruction,
    generationConfig: { temperature }
  });

  const chat = generativeModel.startChat({ history });
  const result = await chat.sendMessage(message);

  return result.response.text();
};

export default generateReply;
