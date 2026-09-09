/**
 * Erro de infraestrutura do armazenamento (banco/arquivo).
 * Carrega um `hint` com o passo a passo de correção para exibir
 * na página amigável /database-error em vez de uma tela genérica.
 */
export class StoreError extends Error {
  hint?: string;
  constructor(message: string, hint?: string) {
    super(message);
    this.name = "StoreError";
    this.hint = hint;
  }
}

export function isStoreError(error: unknown): error is StoreError {
  return error instanceof StoreError;
}
