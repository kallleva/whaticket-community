import { logger } from "../utils/logger";

// Transcrição (Whisper, via whisper-asr-webservice) e síntese de voz (Piper,
// via piper-openai-tts) rodando localmente, nos containers "whisper-asr" e
// "piper-tts" do próprio docker-compose — evita depender da API do Gemini
// (e do custo/latência de rede) pra essas duas tarefas. Usado como primeira
// opção; GeminiProvider/TranscribeAudioService continuam existindo como
// fallback pra quem não tiver esses containers rodando.

const WHISPER_ASR_URL = process.env.WHISPER_ASR_URL || "http://whisper-asr:9000";
const PIPER_TTS_URL = process.env.PIPER_TTS_URL || "http://piper-tts:5000";
const PIPER_VOICE = process.env.PIPER_VOICE || "pt_BR-faber-medium";

// Kokoro tem voz feminina em pt-BR (pf_dora); o Piper só tem vozes masculinas
// em português, então ele fica como fallback se o Kokoro não estiver no ar.
const KOKORO_TTS_URL = process.env.KOKORO_TTS_URL || "";
const KOKORO_VOICE = process.env.KOKORO_VOICE || "pf_dora";

export const transcribeLocal = async (
  audioBuffer: Buffer,
  mimetype: string
): Promise<string | null> => {
  try {
    const extension = mimetype.split("/")[1]?.split(";")[0]?.trim() || "ogg";

    const form = new FormData();
    form.append(
      "audio_file",
      new Blob([audioBuffer], { type: mimetype.split(";")[0] }),
      `audio.${extension}`
    );

    const response = await fetch(
      `${WHISPER_ASR_URL}/asr?output=json&language=pt`,
      { method: "POST", body: form }
    );

    if (!response.ok) {
      logger.warn(`Local Whisper request failed (${response.status}): ${await response.text()}`);
      return null;
    }

    const data = (await response.json()) as { text?: string };
    const transcript = data?.text?.trim();
    return transcript || null;
  } catch (error) {
    logger.error(error, "Error transcribing audio via local Whisper");
    return null;
  }
};

const synthesizeKokoro = async (text: string): Promise<Buffer | null> => {
  if (!KOKORO_TTS_URL) return null;

  try {
    const response = await fetch(`${KOKORO_TTS_URL}/v1/audio/speech`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "kokoro",
        voice: KOKORO_VOICE,
        input: text,
        response_format: "wav"
      })
    });

    if (!response.ok) {
      logger.warn(`Local Kokoro TTS request failed (${response.status}): ${await response.text()}`);
      return null;
    }

    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    logger.error(error, "Error synthesizing speech via local Kokoro TTS");
    return null;
  }
};

export const synthesizeLocal = async (text: string): Promise<Buffer | null> => {
  const kokoroAudio = await synthesizeKokoro(text);
  if (kokoroAudio) return kokoroAudio;

  try {
    const response = await fetch(`${PIPER_TTS_URL}/v1/audio/speech`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "piper",
        voice: PIPER_VOICE,
        input: text,
        response_format: "wav"
      })
    });

    if (!response.ok) {
      logger.warn(`Local Piper TTS request failed (${response.status}): ${await response.text()}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    logger.error(error, "Error synthesizing speech via local Piper TTS");
    return null;
  }
};
