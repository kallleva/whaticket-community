// Sequelize v5 (dialeto MySQL/MariaDB) serializa colunas DataType.JSON ao
// escrever (via JSONTYPE._stringify), mas NÃO faz o parse de volta ao ler —
// o valor retornado do banco fica como string bruta em vez de array/objeto.
// Usado em todo @Column(DataType.JSON) deste projeto para corrigir isso.
export const jsonColumnAccessors = (attributeName: string) => ({
  get(this: any): unknown {
    const raw = this.getDataValue(attributeName);

    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    }

    return raw;
  },
  set(this: any, value: unknown): void {
    this.setDataValue(attributeName, value);
  }
});
