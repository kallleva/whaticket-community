// Serializa chamadas concorrentes para a mesma chave (ex.: contato+conexão)
// — usado para evitar que duas mensagens quase simultâneas do mesmo cliente
// façam o motor de funil/IA rodar duas vezes em paralelo antes do primeiro
// ticket/estado ser persistido (o que geraria respostas duplicadas ou um
// funil iniciado duas vezes). In-process, só vale para 1 instância do
// backend — mesma limitação já documentada em cron/index.ts.
const locks = new Map<string, Promise<unknown>>();

export const withLock = async <T>(key: string, fn: () => Promise<T>): Promise<T> => {
  const previous = locks.get(key) ?? Promise.resolve();
  const run = previous.catch(() => undefined).then(fn);

  locks.set(key, run);

  try {
    return await run;
  } finally {
    if (locks.get(key) === run) {
      locks.delete(key);
    }
  }
};
