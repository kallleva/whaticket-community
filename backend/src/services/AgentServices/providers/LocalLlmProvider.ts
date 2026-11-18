import { logger } from "../../../utils/logger";
import { ChatTurn } from "./GeminiProvider";

// Qualquer endpoint compatível com a API de chat da OpenAI — é o padrão que
// Ollama, LM Studio, vLLM etc. já expõem, então serve pra rodar um modelo
// pequeno local (ex.: Qwen) sem precisar de um provider dedicado por
// ferramenta. Não suporta "tools" (function calling) nesta primeira versão
// — cada servidor local implementa isso de um jeito um pouco diferente.
//
// `keep_alive` não é um campo do padrão OpenAI, mas o Ollama aceita e
// respeita esse campo extra mesmo nesse endpoint de compatibilidade
// (testado manualmente) — mantém o modelo carregado na memória por esse
// tempo depois da última chamada, evitando pagar de novo o custo de
// carregar o modelo do disco (vários segundos a minutos) a cada conversa
// que começa depois de um tempo parado. Em outros servidores (LM Studio,
// vLLM) esse campo extra é simplesmente ignorado.
const LOCAL_LLM_KEEP_ALIVE = process.env.LOCAL_LLM_KEEP_ALIVE || "30m";

interface GenerateReplyParams {
  apiUrl: string;
  model: string;
  systemInstruction: string;
  temperature: number;
  history: ChatTurn[];
  message: string;
}

const generateReply = async ({
  apiUrl,
  model,
  systemInstruction,
  temperature,
  history,
  message
}: GenerateReplyParams): Promise<string> => {
  const baseUrl = apiUrl.replace(/\/+$/, "");

  const messages = [
    { role: "system", content: systemInstruction },
    ...history.map(turn => ({ role: turn.role, content: turn.content })),
    { role: "user", content: message }
  ];

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, temperature, messages, keep_alive: LOCAL_LLM_KEEP_ALIVE })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error(`Local LLM request failed (${response.status}): ${errorBody}`);
    throw new Error(`Local LLM request failed with status ${response.status}`);
  }

  const data = (await response.json()) as any;
  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("Local LLM response had no message content");
  }

  return text;
};

export default generateReply;
