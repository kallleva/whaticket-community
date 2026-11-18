import { spawn } from "child_process";
import { writeFile, readFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomBytes } from "crypto";

// Converte áudio pra OGG/Opus, formato que o WhatsApp espera pra nota de
// voz (ptt). Usa o ffmpeg já presente na imagem Docker do backend via
// processo filho — sem dependência npm nova.
const runFfmpeg = async (inputPath: string, outputPath: string, inputArgs: string[]): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      ...inputArgs,
      "-i",
      inputPath,
      "-c:a",
      "libopus",
      "-b:a",
      "32k",
      "-y",
      outputPath
    ]);

    let stderr = "";
    ffmpeg.stderr.on("data", chunk => {
      stderr += chunk.toString();
    });

    ffmpeg.on("error", reject);
    ffmpeg.on("close", code => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
    });
  });
};

const convertViaFfmpeg = async (
  inputBuffer: Buffer,
  inputExtension: string,
  inputArgs: string[]
): Promise<Buffer> => {
  const id = randomBytes(8).toString("hex");
  const inputPath = join(tmpdir(), `tts-${id}.${inputExtension}`);
  const outputPath = join(tmpdir(), `tts-${id}.ogg`);

  await writeFile(inputPath, inputBuffer);

  try {
    await runFfmpeg(inputPath, outputPath, inputArgs);
    return await readFile(outputPath);
  } finally {
    await Promise.all([
      unlink(inputPath).catch(() => undefined),
      unlink(outputPath).catch(() => undefined)
    ]);
  }
};

// Entrada: PCM cru (o formato que a API de TTS do Gemini devolve) — exige
// informar sample rate/canais explicitamente pro ffmpeg, já que não tem
// cabeçalho nenhum.
export const convertPcmToOggVoice = async (
  pcmBuffer: Buffer,
  sampleRateHz: number
): Promise<Buffer> =>
  convertViaFfmpeg(pcmBuffer, "pcm", ["-f", "s16le", "-ar", String(sampleRateHz), "-ac", "1"]);

// Entrada: um arquivo de áudio com cabeçalho próprio (WAV, mp3 etc. — o que
// o Piper TTS local devolve) — o ffmpeg detecta o formato sozinho.
export const convertAudioFileToOggVoice = async (audioBuffer: Buffer): Promise<Buffer> =>
  convertViaFfmpeg(audioBuffer, "wav", []);
