/**
 * Verificação do cookie de sessão local compatível com Edge Runtime
 * (middleware). Usa Web Crypto — sem dependências de Node.
 * O token tem o formato: `${userId}.${expiraEm}.${hmac_base64url}`.
 */

function base64urlToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  const binary = atob(base64 + pad);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Retorna o userId se o token for íntegro e não expirado; senão null. */
export async function verifySessionTokenEdge(
  token: string | undefined,
  secret: string
): Promise<string | null> {
  if (!token || !secret) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, exp, sig] = parts;
  if (!userId || !exp || !sig) return null;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64urlToUint8Array(sig),
      encoder.encode(`${userId}.${exp}`)
    );
    if (!valid) return null;
    if (Number(exp) < Date.now()) return null;
    return userId;
  } catch {
    return null;
  }
}
