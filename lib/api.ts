import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { firstZodMessage } from "./validation";

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function jsonUnauthorized(): NextResponse {
  return jsonError("Sessão expirada ou inexistente. Faça login novamente.", 401);
}

/** Wrapper simples para handlers com tratamento de erros padronizado. */
export async function handleRoute(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError(firstZodMessage(error), 400);
    }
    const message =
      error instanceof Error ? error.message : "Erro interno inesperado. Tente novamente.";
    console.error("[api]", error);
    return jsonError(message, 500);
  }
}
