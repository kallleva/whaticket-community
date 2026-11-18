import { GoogleGenerativeAI } from "@google/generative-ai";
import AiProvider from "../../models/AiProvider";
import { decrypt } from "../../helpers/Encryption";
import { logger } from "../../utils/logger";
import { transcribeLocal } from "../../helpers/LocalSpeechProvider";

// Modelo fixo pra transcrição via Gemini (independe do modelo escolhido em
// cada Agente — a transcrição roda mesmo antes de qualquer agente estar
// envolvido, ex.: dentro de um node "question" do funil). Só é usado como
// fallback — a primeira tentativa é sempre o Whisper local (ver
// LocalSpeechProvider), que não depende de API externa nem de chave.
const TRANSCRIPTION_MODEL = "gemini-2.0-flash";

const TranscribeAudioService = async (
  base64Data: string,
  mimetype: string
): Promise<string | null> => {
  const localTranscript = await transcribeLocal(Buffer.from(base64Data, "base64"), mimetype);
  if (localTranscript) return localTranscript;

  try {
    const aiProvider = await AiProvider.findOne();
    if (!aiProvider?.apiKeyEncrypted) return null;

    const apiKey = decrypt(aiProvider.apiKeyEncrypted);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: TRANSCRIPTION_MODEL });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimetype.split(";")[0].trim(),
          data: base64Data
        }
      },
      {
        text:
          "Transcreva literalmente o que foi dito neste áudio, em português. " +
          "Responda só com a transcrição, sem comentários, aspas ou formatação extra."
      }
    ]);

    const transcript = result.response.text().trim();
    return transcript || null;
  } catch (error) {
    logger.error(error, "Error transcribing audio message");
    return null;
  }
};

export default TranscribeAudioService;
