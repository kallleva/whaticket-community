import { GoogleGenerativeAI, Content, Part } from "@google/generative-ai";
import { logger } from "../../../utils/logger";
import { ToolDefinition, ToolContext } from "../tools";

// Isolado atrás desta interface simples para a extensibilidade a outros
// provedores de IA (combinada com o usuário) ser viável depois sem
// precisar tocar em RunAiAgentTurnService.ts.
export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface GenerateReplyParams {
  apiKey: string;
  model: string;
  systemInstruction: string;
  temperature: number;
  history: ChatTurn[];
  message: string;
  tools?: ToolDefinition[];
  toolContext?: ToolContext;
}

const MAX_TOOL_ROUNDS = 4;

const toGeminiHistory = (history: ChatTurn[]): Content[] =>
  history.map(turn => ({
    role: turn.role === "assistant" ? "model" : "user",
    parts: [{ text: turn.content }]
  }));

const generateReply = async ({
  apiKey,
  model,
  systemInstruction,
  temperature,
  history,
  message,
  tools,
  toolContext
}: GenerateReplyParams): Promise<string> => {
  const genAI = new GoogleGenerativeAI(apiKey);

  const generativeModel = genAI.getGenerativeModel({
    model,
    systemInstruction,
    generationConfig: { temperature },
    tools:
      tools && tools.length > 0
        ? [{ functionDeclarations: tools.map(tool => tool.declaration) }]
        : undefined
  });

  const chat = generativeModel.startChat({ history: toGeminiHistory(history) });
  let result = await chat.sendMessage(message);

  // Loop de function calling: o modelo pode pedir uma ou mais ferramentas,
  // a gente executa e devolve o resultado, até ele responder com texto
  // final (ou até o limite de rodadas, pra nunca travar o turno).
  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const functionCalls = result.response.functionCalls();
    if (!functionCalls || functionCalls.length === 0) break;
    if (!tools || !toolContext) break;

    const responseParts: Part[] = [];

    for (const call of functionCalls) {
      const tool = tools.find(t => t.declaration.name === call.name);
      let toolResult: unknown;

      try {
        toolResult = tool
          ? await tool.execute(call.args, toolContext)
          : { error: `Ferramenta "${call.name}" não está disponível.` };
      } catch (error) {
        logger.error(error, `Error executing agent tool "${call.name}"`);
        toolResult = {
          error: error instanceof Error ? error.message : "Erro ao executar a ferramenta."
        };
      }

      responseParts.push({
        functionResponse: { name: call.name, response: { result: toolResult } }
      });
    }

    // eslint-disable-next-line no-await-in-loop
    result = await chat.sendMessage(responseParts);
  }

  return result.response.text();
};

export default generateReply;
