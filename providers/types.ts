import type { RawCompany } from "@/types";

export interface ProviderQuery {
  segment: string;
  city: string;
  state: string;
  country: string;
  /** Limite máximo de resultados desejado. */
  limit: number;
}

export interface ProviderResult {
  companies: RawCompany[];
  /** Aviso opcional para exibir na UI (ex.: filtros relaxados). */
  notice?: string;
}

export interface DataProvider {
  id: string;
  label: string;
  /** Variáveis de ambiente necessárias (para mensagens de configuração). */
  envVars: string[];
  description: string;
  /** A fonte está configurada e pode ser usada agora? */
  configured(): boolean;
  search(query: ProviderQuery): Promise<ProviderResult>;
}

export class ProviderError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ProviderError";
    this.status = status;
  }
}

/** Timeout helper para fetch com AbortController. */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 20000, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
