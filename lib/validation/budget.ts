import { z } from "zod";
import { services, type ServiceId } from "@/lib/data/services";

// O zod 4 testa `new Function("")` para decidir se pode compilar validadores
// otimizados. A CSP do site (next.config.ts) bloqueia eval — o zod se recupera
// sozinho, mas o navegador registra uma violação de CSP a cada carregamento.
// jitless desliga o teste: mesma validação, sem eval e sem ruído na CSP.
z.config({ jitless: true });

const serviceIds = services.map((service) => service.id) as [ServiceId, ...ServiceId[]];

// Sem quebra de linha: impede que alguém injete "linhas" falsas na mensagem
// final do WhatsApp/e-mail digitando \n dentro de um campo de uma linha só
// (ex: fingir um campo "Telefone" extra dentro do campo "Nome").
const singleLine = (value: string) => !/[\r\n]/.test(value);

const onlyDigits = (value: string) => value.replace(/\D/g, "");

/**
 * Schema de validação do formulário de orçamento. Cada mensagem de erro é
 * uma CHAVE (não o texto final) — o componente traduz via t(`errors.${chave}`).
 * Isso mantém a validação e a tradução desacopladas, e evita mensagem de erro
 * hardcoded em um idioma só.
 */
export const budgetFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "nameRequired")
    .max(80, "nameInvalid")
    .refine(singleLine, "nameInvalid")
    // Letras (com acentos), espaços, hífen e apóstrofo — sem números nem símbolos.
    .refine((value) => /^[\p{L}\s'-]+$/u.test(value), "nameInvalid"),

  email: z.string().trim().max(200, "emailInvalid").pipe(z.email("emailInvalid")),

  phone: z
    .string()
    .trim()
    .refine(singleLine, "phoneInvalid")
    .refine((value) => {
      const digits = onlyDigits(value);
      return digits.length === 10 || digits.length === 11;
    }, "phoneInvalid"),

  service: z.enum(serviceIds, "serviceRequired"),

  eventDate: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "eventDateInvalid")
    .refine((value) => {
      const date = new Date(`${value}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, "eventDatePast"),

  guestCount: z.coerce
    .number("guestCountInvalid")
    .int("guestCountInvalid")
    .min(1, "guestCountInvalid")
    .max(1000, "guestCountInvalid"),

  message: z.string().trim().max(500, "messageTooLong"),
});

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;

export type BudgetFormInput = {
  name: string;
  email: string;
  phone: string;
  service: string;
  eventDate: string;
  guestCount: string;
  message: string;
};
