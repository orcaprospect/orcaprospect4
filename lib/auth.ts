import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getStore } from "@/lib/store";
import { env } from "@/lib/env";
import { supabaseAuthConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/types";

/**
 * Autenticação simples e segura o suficiente para o MVP:
 * - senhas com scrypt + salt aleatório (módulo nativo `crypto`);
 * - cookie de sessão HttpOnly assinado com HMAC-SHA256 (SESSION_SECRET);
 * - SameSite=Lax + Secure em produção + verificação de origem nas mutações.
 *
 * Camada "preparada" para evoluir para NextAuth/Supabase Auth sem
 * mudar as rotas (basta trocar as funções deste arquivo).
 */

export const SESSION_COOKIE = "op_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

function secret(): string {
  if (env.sessionSecret) return env.sessionSecret;
  // Fallback de desenvolvimento. Em produção, defina SESSION_SECRET.
  if (env.nodeEnv === "production") {
    console.warn(
      "[Orça Prospect] SESSION_SECRET não definido em produção! " +
        "Configure uma chave aleatória (openssl rand -hex 32)."
    );
  }
  return "orca-prospect-dev-secret-nao-use-em-producao";
}

function hmac(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(userId: string): string {
  const payload = `${userId}.${Date.now() + SESSION_MAX_AGE * 1000}`;
  return `${payload}.${hmac(payload)}`;
}

export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, exp, sig] = parts;
  const expected = hmac(`${userId}.${exp}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  if (Number(exp) < Date.now()) return null;
  return userId;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [algo, salt, hash] = stored.split("$");
    if (algo !== "scrypt" || !salt || !hash) return false;
    const candidate = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

export async function setSessionCookie(userId: string): Promise<void> {
  const store = cookies();
  store.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = cookies();
  store.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/** Retorna o usuário autenticado ou null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const userId = verifySessionToken(token);
  if (!userId) return null;
  const user = await getStore().getUserById(userId);
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
}

/** Verifica se a requisição veio da mesma origem (defesa extra p/ CSRF). */
export function assertSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // clientes sem header Origin (curl, server-to-server)
  try {
    const originHost = new URL(origin).host;
    const host = req.headers.get("host");
    return originHost === host;
  } catch {
    return false;
  }
}
