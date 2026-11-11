import { useEffect, useRef, useState } from "react";
import type { z } from "zod";
import {
  inputClasses,
  invalidBorderClasses,
  validBorderClasses,
  type Channel,
  type SendStatus,
} from "@/components/forms/FormParts";
import { trackEvent } from "@/lib/analytics/gtag";
import { buildMailtoUrl, buildWhatsappUrl } from "@/lib/data/contacts";

type FormValues = Record<string, string | boolean>;

/**
 * Lógica comum aos formulários que terminam no WhatsApp ou no e-mail do
 * próprio visitante (orçamento e aulas): estado dos campos, validação com o
 * schema zod, foco no primeiro erro e abertura do link pronto.
 *
 * Nada passa por um servidor nosso: o navegador abre o WhatsApp/e-mail com a
 * mensagem pronta e o visitante decide se envia (ver
 * docs/07-protecao-de-dados.md).
 */
export function useContactForm<Values extends FormValues, Schema extends z.ZodType>({
  initialValues,
  schema,
  idPrefix,
  translateError,
  compose,
}: {
  initialValues: Values;
  schema: Schema;
  /** Prefixo dos ids dos campos ("budget" → "budget-name"). */
  idPrefix: string;
  /** Recebe a chave de erro do schema (ex: "nameInvalid") e devolve o texto. */
  translateError: (key: string) => string;
  /** Monta a mensagem, o assunto do e-mail e o que vai para o GA (nunca dado pessoal). */
  compose: (data: z.output<Schema>) => {
    message: string;
    subject: string;
    analytics: Record<string, string>;
  };
}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [status, setStatus] = useState<SendStatus>({ kind: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  function setField<Field extends keyof Values>(field: Field, value: Values[Field]) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleChange(field: keyof Values) {
    return (
      event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
      const { target } = event;
      const value =
        target instanceof HTMLInputElement && target.type === "checkbox"
          ? target.checked
          : target.value;
      setField(field, value as Values[typeof field]);
    };
  }

  function submit(channel: Channel) {
    if (isSubmitting) return;

    const result = schema.safeParse(values);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof Values, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof Values;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      setStatus({ kind: "invalid" });

      const firstInvalidField = Object.keys(fieldErrors)[0];
      document.getElementById(`${idPrefix}-${firstInvalidField}`)?.focus();
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const { message, subject, analytics } = compose(result.data);
    trackEvent("generate_lead", { method: channel, ...analytics });

    // Com "noopener", window.open sempre devolve null — não dá para saber se
    // a aba foi bloqueada. Por isso a mensagem de sucesso sempre traz um link
    // manual com a mesma URL.
    if (channel === "whatsapp") {
      const url = buildWhatsappUrl(message);
      window.open(url, "_blank", "noopener,noreferrer");
      setStatus({ kind: "sent", channel, url });
    } else {
      const url = buildMailtoUrl(subject, message);
      window.location.href = url;
      setStatus({ kind: "sent", channel, url });
    }

    resetTimeoutRef.current = setTimeout(() => setIsSubmitting(false), 1200);
  }

  function fieldError(field: keyof Values) {
    const key = errors[field];
    return key ? translateError(key) : undefined;
  }

  /** id, name, aria-* e classes de um campo de texto/select. */
  function inputProps(field: keyof Values & string) {
    const error = fieldError(field);
    return {
      id: `${idPrefix}-${field}`,
      name: field,
      "aria-invalid": Boolean(error),
      "aria-describedby": error ? `${idPrefix}-${field}-error` : undefined,
      className: `${inputClasses} ${error ? invalidBorderClasses : validBorderClasses}`,
    };
  }

  return { values, status, isSubmitting, setField, handleChange, submit, fieldError, inputProps };
}
