import { z } from "zod";
import { services, type ServiceId } from "@/lib/data/services";

// O zod 4 testa `new Function("")` para decidir se pode compilar validadores
// otimizados. A CSP do site (next.config.ts) bloqueia eval — o zod se recupera
// sozinho, mas o navegador registra uma violação de CSP a cada carregamento.
// jitless desliga o teste: mesma validação, sem eval e sem ruído na CSP.
z.config({ jitless: true });

const serviceIds = services.map((service) => service.id) as [ServiceId, ...ServiceId[]];

/** Até quantos anos à frente aceitamos uma data de evento. */
const MAX_YEARS_AHEAD = 3;

// Caracteres invisíveis usados para falsificar o texto exibido: controles
// bidirecionais (U+202A–202E, U+2066–2069) invertem a ordem visual de um
// trecho; marcas de direção (U+200E/F), zero-width space (U+200B) e BOM
// (U+FEFF) escondem conteúdo. Nenhum deles tem uso legítimo num orçamento.
// O zero-width joiner (U+200D) fica de fora: ele compõe emojis como 👨‍👩‍👧.
const SPOOFING_CHARS = /[​‎‏‪-‮⁦-⁩﻿]/;

// Caracteres de controle (U+0000–U+001F, U+007F–U+009F), exceto quebra de
// linha e tab — só fazem sentido no campo de mensagem, que é multilinha.
const CONTROL_CHARS_EXCEPT_NEWLINE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/;

/**
 * Normaliza para NFC antes de validar: "é" pode chegar como um caractere só
 * (U+00E9) ou como "e" + acento combinante (U+0065 U+0301), comum em texto
 * colado de PDFs ou digitado no macOS. Sem normalizar, um nome legítimo como
 * "José" seria recusado e dois textos visualmente iguais seriam diferentes.
 */
const normalizedText = () => z.string().normalize("NFC").trim();

/**
 * Schema de validação do formulário de orçamento. Cada mensagem de erro é
 * uma CHAVE (não o texto final) — o componente traduz via t(`errors.${chave}`).
 * Isso mantém a validação e a tradução desacopladas, e evita mensagem de erro
 * hardcoded em um idioma só.
 *
 * O e-mail não é coletado de propósito (minimização — LGPD art. 6º, III): no
 * WhatsApp o número do remetente já identifica o cliente, e no e-mail o
 * próprio remetente já aparece. Ver docs/07-protecao-de-dados.md.
 */
export const budgetFormSchema = z.object({
  name: normalizedText()
    .min(2, "nameRequired")
    .max(80, "nameInvalid")
    // Letras (com acentos, inclusive combinantes), espaço, hífen e apóstrofo
    // (reto ou tipográfico). Espaço literal em vez de \s: \s aceitaria quebra
    // de linha e tab, que permitiriam injetar "linhas" falsas na mensagem
    // final (ex: "João\nTelefone: 000" fingindo ser outro campo).
    .regex(/^[\p{L}\p{M} '’-]+$/u, "nameInvalid"),

  phone: z
    .string()
    .trim()
    .max(20, "phoneInvalid")
    // Só dígitos e a pontuação usual de telefone: "+55 (27) 99999-9999".
    // Antes contávamos apenas os dígitos, e "<b>27999999999</b>" passava.
    .regex(/^\+?[\d\s().-]+$/, "phoneInvalid")
    .refine((value) => {
      let digits = value.replace(/\D/g, "");
      // DDI do Brasil opcional: "55 27 99999-9999" vira "27 99999-9999".
      if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
        digits = digits.slice(2);
      }
      return digits.length === 10 || digits.length === 11;
    }, "phoneInvalid"),

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

  message: normalizedText()
    .max(500, "messageTooLong")
    .refine((value) => !CONTROL_CHARS_EXCEPT_NEWLINE.test(value), "messageInvalid")
    .refine((value) => !SPOOFING_CHARS.test(value), "messageInvalid"),

  // Ciência da Política de Privacidade (/privacidade). Não é a base legal do
  // tratamento (essa é o art. 7º, V da LGPD), mas garante transparência:
  // ninguém envia dados sem ter tido a chance de ler a política.
  privacyAccepted: z.literal(true, "privacyRequired"),
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
