// Modelos de linguagem respondem em Markdown (**negrito**, # título, listas
// com "-", etc.). Isso fica feio no WhatsApp e, pior, o sintetizador de voz
// LÊ os símbolos ("asterisco asterisco..."). Estas funções limpam o texto
// pra cada destino.

const EMOJI_REGEX =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{20E3}]/gu;

// Texto pro WhatsApp: converte o Markdown padrão pro formato do próprio
// WhatsApp (*negrito*, _itálico_) e tira o que o WhatsApp não renderiza.
export const markdownToWhatsapp = (text: string): string =>
  text
    .replace(/```[a-z]*\n?([\s\S]*?)```/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+(.*)$/gm, "*$1*")
    .replace(/\*\*\*(.+?)\*\*\*/g, "*$1*")
    .replace(/\*\*(.+?)\*\*/g, "*$1*")
    .replace(/__(.+?)__/g, "*$1*")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1: $2")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/^\s*---+\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

// Texto pra ser FALADO: sem nenhum símbolo de formatação, sem emoji, sem
// links, e com as quebras de linha viradas em pausas (ponto) pra voz
// soar fluida em vez de ler tudo emendado.
export const markdownToSpeech = (text: string): string => {
  const cleaned = text
    .replace(/```[a-z]*\n?([\s\S]*?)```/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/(\*{1,3}|_{1,3}|~{1,2})(.+?)\1/g, "$2")
    .replace(/[*_~#>|]/g, "")
    .replace(/^\s*[-•+]\s+/gm, "")
    .replace(/^\s*(\d+)[.)]\s+/gm, "")
    .replace(/^\s*---+\s*$/gm, "")
    .replace(EMOJI_REGEX, "")
    .replace(/\(([^)]*)\)/g, ", $1,")
    .replace(/,[ \t]*$/gm, ".");

  return cleaned
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => (/[.!?:;,]$/.test(line) ? line : `${line}.`))
    .join(" ")
    .replace(/,\s*,/g, ",")
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/([.!?])\s*\./g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
};
