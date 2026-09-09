/** Nome do cookie de sessão + segredo de fallback (importável no middleware/edge). */
export const SESSION_COOKIE = "op_session";

/** Fallback apenas para desenvolvimento. Em produção defina SESSION_SECRET. */
export const SESSION_FALLBACK_SECRET =
  "orca-prospect-dev-secret-nao-use-em-producao";
