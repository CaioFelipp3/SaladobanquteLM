"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { buildMailtoUrl, buildWhatsappUrl, contacts } from "@/lib/data/contacts";
import { services } from "@/lib/data/services";
import { Link } from "@/lib/i18n/navigation";
import { budgetFormSchema, parseLocalDate, type BudgetFormInput } from "@/lib/validation/budget";

const emptyValues: BudgetFormInput = {
  name: "",
  phone: "",
  service: "",
  eventDate: "",
  guestCount: "",
  message: "",
  privacyAccepted: false,
};

type FieldErrors = Partial<Record<keyof BudgetFormInput, string>>;
type Status =
  | { kind: "idle" }
  | { kind: "invalid" }
  // Guarda a URL gerada para oferecer um link manual caso o navegador
  // bloqueie a nova aba ou não exista app de e-mail configurado.
  | { kind: "sent"; channel: "whatsapp" | "email"; url: string };

const inputClasses =
  "w-full rounded-md border bg-white px-4 py-2.5 text-[15px] placeholder:text-banquete-dark/70 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-1 focus-visible:outline-banquete-rose";
// Cor da borda em classes separadas: aplicar "border-banquete-border" e
// "border-red-500" juntas no mesmo elemento deixaria o resultado depender da
// ordem do CSS gerado, não da ordem no className.
const validBorderClasses = "border-banquete-input-border focus:border-banquete-rose";
const invalidBorderClasses = "border-red-500 focus:border-red-500";
const linkClasses =
  "font-semibold text-banquete-rose underline underline-offset-2 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-banquete-rose";
const labelClasses = "mb-1.5 block text-[13px] font-semibold ";

export default function BudgetForm() {
  const t = useTranslations("Budget");
  const tServices = useTranslations("Services");
  const locale = useLocale();

  const [values, setValues] = useState<BudgetFormInput>(emptyValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  function handleChange(field: keyof BudgetFormInput) {
    return (
      event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
      const { target } = event;
      const value =
        target instanceof HTMLInputElement && target.type === "checkbox"
          ? target.checked
          : target.value;
      setValues((prev) => ({ ...prev, [field]: value }));
    };
  }

  function formatEventDate(iso: string) {
    return parseLocalDate(iso).toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function submit(channel: "whatsapp" | "email") {
    if (isSubmitting) return;

    const result = budgetFormSchema.safeParse(values);

    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof BudgetFormInput;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      setStatus({ kind: "invalid" });

      const firstInvalidField = Object.keys(fieldErrors)[0];
      document.getElementById(`budget-${firstInvalidField}`)?.focus();
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const data = result.data;
    const serviceTitle = tServices(`items.${data.service}.title`);
    const message = t("messageTemplate", {
      name: data.name,
      phone: data.phone,
      service: serviceTitle,
      eventDate: formatEventDate(data.eventDate),
      guestCount: data.guestCount,
      message: data.message || "—",
    });

    // Nada disso passa por um backend nosso: montamos o link e devolvemos o
    // controle para o WhatsApp/cliente de e-mail do próprio visitante — ver
    // docs/05-seguranca.md (minimização de dados / LGPD).
    // Com "noopener", window.open sempre devolve null — não dá para saber se
    // a aba foi bloqueada. Por isso a mensagem de sucesso sempre traz um link
    // manual com a mesma URL.
    if (channel === "whatsapp") {
      const url = buildWhatsappUrl(message);
      window.open(url, "_blank", "noopener,noreferrer");
      setStatus({ kind: "sent", channel, url });
    } else {
      const url = buildMailtoUrl(t("emailSubject", { service: serviceTitle }), message);
      window.location.href = url;
      setStatus({ kind: "sent", channel, url });
    }

    resetTimeoutRef.current = setTimeout(() => setIsSubmitting(false), 1200);
  }

  function fieldError(field: keyof BudgetFormInput) {
    const key = errors[field];
    return key ? t(`errors.${key}`) : undefined;
  }

  function inputProps(field: keyof BudgetFormInput) {
    const error = fieldError(field);
    return {
      id: `budget-${field}`,
      name: field,
      "aria-invalid": Boolean(error),
      "aria-describedby": error ? `budget-${field}-error` : undefined,
      className: `${inputClasses} ${error ? invalidBorderClasses : validBorderClasses}`,
    };
  }

  return (
    <form
      noValidate
      onSubmit={(event) => event.preventDefault()}
      className="mx-auto mt-8 max-w-[560px]"
    >
      <div className="mb-5">
        <label htmlFor="budget-name" className={labelClasses}>
          {t("fields.name")}
        </label>
        <input
          {...inputProps("name")}
          type="text"
          autoComplete="name"
          maxLength={80}
          value={values.name}
          onChange={handleChange("name")}
        />
        <FieldError id="budget-name-error" message={fieldError("name")} />
      </div>

      <div className="mb-5">
        <label htmlFor="budget-phone" className={labelClasses}>
          {t("fields.phone")}
        </label>
        <input
          {...inputProps("phone")}
          type="tel"
          autoComplete="tel"
          placeholder={t("fields.phonePlaceholder")}
          maxLength={20}
          value={values.phone}
          onChange={handleChange("phone")}
        />
        <FieldError id="budget-phone-error" message={fieldError("phone")} />
      </div>

      <div className="mb-5">
        <label htmlFor="budget-service" className={labelClasses}>
          {t("fields.service")}
        </label>
        <select
          {...inputProps("service")}
          value={values.service}
          onChange={handleChange("service")}
        >
          <option value="">{t("fields.servicePlaceholder")}</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {tServices(`items.${service.id}.title`)}
            </option>
          ))}
        </select>
        <FieldError id="budget-service-error" message={fieldError("service")} />
      </div>

      {/* Sem atributo `min`: calcular "hoje" durante o render rodaria no
          servidor (no build) e no cliente, em fusos/dias diferentes, causando
          erro de hidratação. A regra "não é antes de hoje" é garantida pelo
          schema zod (eventDatePast) no envio. */}
      <div className="mb-5">
        <label htmlFor="budget-eventDate" className={labelClasses}>
          {t("fields.eventDate")}
        </label>
        <input
          {...inputProps("eventDate")}
          type="date"
          value={values.eventDate}
          onChange={handleChange("eventDate")}
        />
        <FieldError id="budget-eventDate-error" message={fieldError("eventDate")} />
      </div>

      <div className="mb-5">
        <label htmlFor="budget-guestCount" className={labelClasses}>
          {t("fields.guestCount")}
        </label>
        <input
          {...inputProps("guestCount")}
          type="number"
          inputMode="numeric"
          min={1}
          max={1000}
          value={values.guestCount}
          onChange={handleChange("guestCount")}
        />
        <FieldError id="budget-guestCount-error" message={fieldError("guestCount")} />
      </div>

      <div className="mb-5">
        <label htmlFor="budget-message" className={labelClasses}>
          {t("fields.message")} <span className="font-normal text-banquete-dark/70">{t("messageOptional")}</span>
        </label>
        <textarea
          {...inputProps("message")}
          rows={4}
          maxLength={500}
          value={values.message}
          onChange={handleChange("message")}
        />
        <FieldError id="budget-message-error" message={fieldError("message")} />
      </div>

      <div className="mb-5">
        <div className="flex items-start gap-2.5">
          <input
            id="budget-privacyAccepted"
            name="privacyAccepted"
            type="checkbox"
            checked={values.privacyAccepted}
            onChange={handleChange("privacyAccepted")}
            aria-invalid={Boolean(fieldError("privacyAccepted"))}
            aria-describedby={
              fieldError("privacyAccepted") ? "budget-privacyAccepted-error" : undefined
            }
            className="mt-1 h-4 w-4 shrink-0 accent-banquete-rose focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-banquete-rose"
          />
          <label htmlFor="budget-privacyAccepted" className="text-sm">
            {t.rich("privacyConsent", {
              link: (chunks) => (
                <Link
                  href="/privacidade"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClasses}
                >
                  {chunks}
                  <span className="sr-only"> {t("opensInNewTab")}</span>
                </Link>
              ),
            })}
          </label>
        </div>
        <FieldError id="budget-privacyAccepted-error" message={fieldError("privacyAccepted")} />
      </div>

      <p className="mb-5 text-xs leading-relaxed text-banquete-dark/70">{t("privacyNote")}</p>

      <div className="flex flex-col gap-3 xs:flex-row">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => submit("whatsapp")}
          className="flex min-h-11 flex-1 items-center justify-center rounded-md bg-whatsapp px-5 py-3 text-xs font-semibold uppercase text-white transition-colors hover:bg-whatsapp-dark focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-banquete-rose disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? t("submitting") : t("submitWhatsapp")}
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => submit("email")}
          className="flex min-h-11 flex-1 items-center justify-center rounded-md bg-banquete-rose px-5 py-3 text-xs font-semibold uppercase text-white transition-colors hover:bg-banquete-rose-dark focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-banquete-rose disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? t("submitting") : t("submitEmail")}
        </button>
      </div>

      <div role="status" aria-live="polite" className="mt-5">
        {status.kind === "sent" && (
          <p className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <strong>{t("successTitle")}</strong>{" "}
            {status.channel === "whatsapp" ? t("successWhatsapp") : t("successEmail")}{" "}
            {t.rich(status.channel === "whatsapp" ? "fallbackWhatsapp" : "fallbackEmail", {
              link: (chunks) => (
                <a
                  href={status.url}
                  {...(status.channel === "whatsapp"
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className={linkClasses}
                >
                  {chunks}
                </a>
              ),
              email: contacts.email,
            })}
          </p>
        )}
      </div>

      {/* Fora da região role="status": regiões "live" aninhadas fazem alguns
          leitores de tela anunciarem a mesma mensagem duas vezes. */}
      {status.kind === "invalid" && (
        <p role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <strong>{t("errorTitle")}</strong> {t("errorGeneric")}
        </p>
      )}
    </form>
  );
}

// Sem role="alert": no envio inválido o foco vai para o primeiro campo com
// erro, e o aria-describedby do campo já faz o leitor de tela ler a mensagem.
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-[13px] text-red-700">
      {message}
    </p>
  );
}
