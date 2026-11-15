// Acumula fragmentos de mensagem de um mesmo ticket por uma janela de tempo
// antes de processá-los como uma única resposta — ao contrário de Debounce.ts
// (que só atrasa/cancela a reexecução de uma função fechada sobre um corpo
// fixo), este helper guarda o CONTEÚDO de cada chamada e junta tudo no flush.
interface BufferEntry {
  ticketId: number;
  fragments: string[];
  timeout: NodeJS.Timeout;
}

const buffers: BufferEntry[] = [];

export const bufferIncomingFragment = (
  ticketId: number,
  fragment: string,
  waitMs: number,
  onFlush: (joinedBody: string) => Promise<void> | void
): void => {
  const existingIndex = buffers.findIndex(b => b.ticketId === ticketId);

  if (existingIndex !== -1) {
    clearTimeout(buffers[existingIndex].timeout);
    buffers[existingIndex].fragments.push(fragment);
  } else {
    buffers.push({ ticketId, fragments: [fragment], timeout: undefined as any });
  }

  const entry = buffers.find(b => b.ticketId === ticketId) as BufferEntry;

  entry.timeout = setTimeout(() => {
    const index = buffers.findIndex(b => b.ticketId === ticketId);
    const joinedBody =
      index !== -1 ? buffers[index].fragments.join(" ") : fragment;

    if (index !== -1) {
      buffers.splice(index, 1);
    }

    void onFlush(joinedBody);
  }, waitMs);
};
