import { z } from "zod";
import { LEAD_STATUSES } from "@/types";

/** Sanitiza texto: remove caracteres de controle e limita tamanho. */
function safeText(max: number) {
  return z
    .string()
    .transform((v) => v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim())
    .refine((v) => v.length > 0, "Campo obrigatório.");
}

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome (mínimo 2 caracteres).")
    .max(80, "Nome muito longo."),
  email: z.string().trim().toLowerCase().email("E-mail inválido.").max(120, "E-mail muito longo."),
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres.")
    .max(100, "Senha muito longa."),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido.").max(120),
  password: z.string().min(1, "Informe a senha.").max(100),
});

export const searchSchema = z.object({
  segment: z
    .string()
    .trim()
    .min(2, "Informe o segmento ou palavra-chave (mínimo 2 caracteres).")
    .max(80, "Segmento muito longo."),
  city: z.string().trim().max(80).optional().default(""),
  state: z.string().trim().max(40).optional().default(""),
  country: z.string().trim().max(60).optional().default(""),
  limit: z.coerce.number().int().min(10).max(60).optional().default(60),
});

export const leadPatchSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  favorite: z.boolean().optional(),
  addTags: z.array(z.string().trim().min(1).max(24, "Tag muito longa (máx. 24).")).max(10).optional(),
  removeTags: z.array(z.string().trim().min(1).max(24)).max(20).optional(),
  newNote: z
    .string()
    .trim()
    .min(1, "Escreva uma observação antes de salvar.")
    .max(2000, "Observação muito longa (máx. 2000).")
    .optional(),
});

export const createLeadSchema = z.object({
  companyId: z.string().trim().min(1, "Empresa inválida."),
});

export const favoriteSchema = z.object({
  companyId: z.string().trim().min(1, "Empresa inválida."),
  favorite: z.boolean().optional(),
});

export const accountPatchSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome.").max(80).optional(),
    currentPassword: z.string().max(100).optional().default(""),
    newPassword: z.string().max(100).optional().default(""),
  })
  .refine((d) => !(d.newPassword && !d.currentPassword), {
    message: "Informe a senha atual para alterá-la.",
    path: ["currentPassword"],
  });

/** Extrai a primeira mensagem de erro amigável de um ZodError. */
export function firstZodMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Dados inválidos.";
}
