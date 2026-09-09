import clsx, { type ClassValue } from "clsx";

/** Junta classes condicionalmente. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(...inputs);
}

/** Remove acentos e normaliza texto para comparação/deduplicação. */
export function normalizeText(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Normaliza nome de empresa para detecção de duplicatas. */
export function normalizeName(name: string): string {
  return normalizeText(name)
    .replace(/\b(ltda|me|epp|eireli|sa|s a|s\/a|ss|mei|grupo|empresa)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normaliza local (cidade/UF) para detecção de duplicatas. */
export function normalizeLocation(value: string | null | undefined): string {
  if (!value) return "";
  return normalizeText(value).replace(/\s+/g, "");
}

/** Formata data/hora em pt-BR. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Garante que a URL tenha esquema. */
export function ensureUrl(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}

/** Host amigável para exibição. */
export function hostOf(value: string | null | undefined): string | null {
  const url = ensureUrl(value);
  if (!url) return null;
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return value ?? null;
  }
}

/** Extrai dígitos de um telefone. */
export function phoneDigits(value: string | null | undefined): string {
  return (value ?? "").replace(/\D+/g, "");
}

/** Verifica se o número é plausível para link de WhatsApp (e não é placeholder). */
export function isPlausiblePhone(value: string | null | undefined): boolean {
  const d = phoneDigits(value);
  if (d.length < 10 || d.length > 13) return false;
  if (/^0+$/.test(d)) return false; // placeholders de demonstração
  return true;
}

/** Link wa.me a partir de um telefone, se plausível. */
export function whatsappLink(value: string | null | undefined): string | null {
  if (!isPlausiblePhone(value)) return null;
  return `https://wa.me/${phoneDigits(value)}`;
}

/** Normaliza handle do Instagram para URL. */
export function instagramUrl(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  if (/instagram\.com\//i.test(v)) return ensureUrl(v);
  const handle = v.replace(/^@/, "").replace(/\/+$/, "");
  if (!handle) return null;
  return `https://instagram.com/${handle}`;
}

/** A empresa tem algum contato disponível (comercial)? */
export function hasContact(c: {
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
}): boolean {
  return Boolean(c.phone || c.whatsapp || c.email);
}

/** Iniciais para avatar. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

/** Limita tamanho de texto para entrada (sanitização leve). */
export function clampText(value: string, max: number): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").slice(0, max);
}
