import { formatDateTime } from "./utils";
import type { LeadView } from "@/types";

/**
 * Gera CSV (separador ";" e BOM UTF-8 — abre corretamente no Excel pt-BR)
 * apenas com colunas comerciais necessárias (LGPD: minimização de dados).
 */
export const CSV_COLUMNS = [
  "Nome",
  "Categoria",
  "Cidade",
  "Estado",
  "Website",
  "Telefone comercial",
  "WhatsApp comercial",
  "E-mail empresarial",
  "Instagram",
  "Score",
  "Data de coleta",
] as const;

function escapeCsv(value: string | number | null | undefined): string {
  const s = String(value ?? "");
  if (/[;"\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildLeadsCsv(leads: LeadView[]): string {
  const rows: string[] = [CSV_COLUMNS.join(";")];
  for (const lead of leads) {
    const c = lead.company;
    rows.push(
      [
        c.name,
        c.category ?? "",
        c.city ?? "",
        c.state ?? "",
        c.website ?? "",
        c.phone ?? "",
        c.whatsapp ?? "",
        c.email ?? "",
        c.instagram ?? "",
        c.score,
        formatDateTime(c.lastUpdatedAt),
      ]
        .map(escapeCsv)
        .join(";"),
    );
  }
  // BOM para Excel reconhecer UTF-8
  return `\uFEFF${rows.join("\r\n")}`;
}
