import { decrypt } from "../../helpers/Encryption";
import AiProvider from "../../models/AiProvider";
import { logger } from "../../utils/logger";

// Modelo de TTS do Gemini (preview) — chamado via REST puro porque o SDK
// instalado (@google/generative-ai 0.24.1) é anterior ao suporte a saída
// de áudio (responseModalities/speechConfig não existem nos tipos dele).
// A API REST aceita esses campos independente da versão do SDK JS.
const TTS_MODEL = "gemini-2.5-flash-preview-tts";
const VOICE_NAME = "Kore";

export interface TtsResult {
  pcmBuffer: Buffer;
  sampleRateHz: number;
}

const SynthesizeSpeechService = async (text: string): Promise<TtsResult | null> => {
  try {
    const aiProvider = await AiProvider.findOne();
    if (!aiProvider?.apiKeyEncrypted) return null;

    const apiKey = decrypt(aiProvider.apiKeyEncrypted);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_NAME } }
            }
          }
        })
      }
    );

    if (!response.ok) {
      logger.warn(`TTS request failed (${response.status}): ${await response.text()}`);
      return null;
    }

    const data = (await response.json()) as any;
    const part = data?.candidates?.[0]?.content?.parts?.[0];
    const base64Pcm: string | undefined = part?.inlineData?.data;
    const mimeType: string | undefined = part?.inlineData?.mimeType;

    if (!base64Pcm) {
      logger.warn("TTS response had no inline audio data");
      return null;
    }

    const rateMatch = /rate=(\d+)/.exec(mimeType || "");
    const sampleRateHz = rateMatch ? Number(rateMatch[1]) : 24000;

    return { pcmBuffer: Buffer.from(base64Pcm, "base64"), sampleRateHz };
  } catch (error) {
    logger.error(error, "Error synthesizing speech via Gemini TTS");
    return null;
  }
};

export default SynthesizeSpeechService;
