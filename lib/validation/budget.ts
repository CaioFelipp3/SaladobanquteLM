import { z } from "zod";
import { services, type ServiceId } from "@/lib/data/services";
import { messageField, nameField, phoneField, privacyField } from "@/lib/validation/common";

const serviceIds = services.map((service) => service.id) as [ServiceId, ...ServiceId[]];

/** Até quantos anos à frente aceitamos uma data de evento. */
const MAX_YEARS_AHEAD = 3;

/**
 * Schema de validação do formulário de orçamento. Nome, telefone, mensagem e
 * ciência da política vêm de lib/validation/common.ts (mesmas regras do
 * formulário de aulas).
 *
 * O e-mail não é coletado de propósito (minimização — LGPD art. 6º, III): no
 * WhatsApp o número do remetente já identifica o cliente, e no e-mail o
 * próprio remetente já aparece. Ver docs/07-protecao-de-dados.md.
 */
export const budgetFormSchema = z.object({
  name: nameField,
  phone: phoneField,
  service: z.enum(serviceIds, "serviceRequired"),

  eventDate: z
    .string()
    // Formato exato do <input type="date">. Date.parse sozinho aceitaria
    // "2027" ou "May 5" e ajustaria datas impossíveis em silêncio.
    .regex(/^\d{4}-\d{2}-\d{2}$/, "eventDateInvalid")
    .refine(isRealCalendarDate, "eventDateInvalid")
    .refine((value) => parseLocalDate(value) >= startOfToday(), "eventDatePast")
    .refine((value) => {
      const limit = startOfToday();
      limit.setFullYear(limit.getFullYear() + MAX_YEARS_AHEAD);
      return parseLocalDate(value) <= limit;
    }, "eventDateTooFar"),

  guestCount: z
    .string()
    .trim()
    // Só dígitos: z.coerce.number aceitava "0x10" (16) e "1e3" (1000).
    .regex(/^\d{1,4}$/, "guestCountInvalid")
    .transform(Number)
    .pipe(z.number().int().min(1, "guestCountInvalid").max(1000, "guestCountInvalid")),

  message: messageField,
  privacyAccepted: privacyField,
});

/** "2027-05-20" → Date à meia-noite no fuso do visitante (não UTC). */
export function parseLocalDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Rejeita datas que o Date ajustaria em silêncio, como 30/02 → 02/03. */
function isRealCalendarDate(iso: string): boolean {
  const [year, month, day] = iso.split("-").map(Number);
  const date = parseLocalDate(iso);
  return (
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  );
}

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/** Estado bruto do formulário, antes da validação. */
export type BudgetFormInput = {
  name: string;
  phone: string;
  service: string;
  eventDate: string;
  guestCount: string;
  message: string;
  privacyAccepted: boolean;
};
