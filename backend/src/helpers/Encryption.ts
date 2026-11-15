import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

// Não existe nenhum padrão de criptografia reversível neste projeto hoje
// (bcrypt, usado para senha de usuário, é hash unidirecional). Usado para
// guardar a API key de provedores de IA (ex.: Gemini) sem texto plano no
// banco. Em produção, defina ENCRYPTION_KEY (qualquer string forte) como
// variável de ambiente — sem ela, cai num valor padrão de desenvolvimento,
// no mesmo espírito do fallback já usado em JWT_SECRET (config/auth.ts).
const ENCRYPTION_KEY = createHash("sha256")
  .update(process.env.ENCRYPTION_KEY || "whaticket-dev-encryption-key")
  .digest();

const ALGORITHM = "aes-256-gcm";

export const encrypt = (plainText: string): string => {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
};

export const decrypt = (payload: string): string => {
  const [ivHex, authTagHex, cipherHex] = payload.split(":");

  const decipher = createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(cipherHex, "hex")),
    decipher.final()
  ]);

  return decrypted.toString("utf8");
};
