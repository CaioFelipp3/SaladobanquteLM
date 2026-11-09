import { z } from "zod";
import { classes, type ClassId } from "@/lib/data/classes";
import { messageField, nameField, phoneField, privacyField } from "@/lib/validation/common";

const classIds = classes.map((item) => item.id) as [ClassId, ...ClassId[]];

/**
 * Formulário de interesse nas aulas de etiqueta. Mesmas regras de nome,
 * telefone e mensagem do orçamento (lib/validation/common.ts); sem e-mail
 * pelo mesmo motivo (minimização — ver docs/07-protecao-de-dados.md).
 */
export const classInterestSchema = z.object({
  name: nameField,
  phone: phoneField,
  classId: z.enum(classIds, "classRequired"),
  message: messageField,
  privacyAccepted: privacyField,
});

/** Estado bruto do formulário, antes da validação. */
export type ClassInterestInput = {
  name: string;
  phone: string;
  classId: string;
  message: string;
  privacyAccepted: boolean;
};
