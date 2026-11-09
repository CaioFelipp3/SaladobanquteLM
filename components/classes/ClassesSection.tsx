"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  FieldError,
  inputClasses,
  invalidBorderClasses,
  labelClasses,
  linkClasses,
  submitEmailClasses,
  submitWhatsappClasses,
  validBorderClasses,
} from "@/components/forms/FormParts";
import Ornament from "@/components/ui/Ornament";
import SectionHeader from "@/components/ui/SectionHeader";
import { trackEvent } from "@/lib/analytics/gtag";
import { classes, type ClassId } from "@/lib/data/classes";
import { buildMailtoUrl, buildWhatsappUrl, contacts } from "@/lib/data/contacts";
import { Link } from "@/lib/i18n/navigation";
import { focusRing } from "@/lib/ui/styles";
import { classInterestSchema, type ClassInterestInput } from "@/lib/validation/classInterest";

const emptyValues: ClassInterestInput = {
  name: "",
  phone: "",
  classId: "",
  message: "",
  privacyAccepted: false,
};

type FieldErrors = Partial<Record<keyof ClassInterestInput, string>>;
type Status =
  | { kind: "idle" }
  | { kind: "invalid" }
  // Guarda a URL gerada para oferecer um link manual caso o navegador
  // bloqueie a nova aba ou não exista app de e-mail configurado.
  | { kind: "sent"; channel: "whatsapp" | "email"; url: string };

// Client Component: o botão "Tenho interesse" de cada card preenche a aula
// no formulário logo abaixo — por isso cards e formulário dividem o estado.
// Textos comuns aos formulários (campos, erros, envio) vêm do namespace
// "Budget", os mesmos do orçamento.
export default function ClassesSection({
  images,
}: {
  images: Partial<Record<ClassId, string>>;
}) {
  const t = useTranslations("Classes");
  const tForm = useTranslations("Budget");

  const [values, setValues] = useState<ClassInterestInput>(emptyValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  function chooseClass(id: ClassId) {
    setValues((prev) => ({ ...prev, classId: id }));
    // Rola até o formulário e põe o foco no primeiro campo; quem navega pelo
    // teclado continua dali, sem voltar ao topo da página.
    // A regra de prefers-reduced-motion do globals.css não alcança rolagem
    // feita por JavaScript — por isso a checagem aqui.
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    nameRef.current?.focus({ preventScroll: true });
    document
      .getElementById("inscricao")
      ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  function handleChange(field: keyof ClassInterestInput) {
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

  function submit(channel: "whatsapp" | "email") {
    if (isSubmitting) return;

    const result = classInterestSchema.safeParse(values);

    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ClassInterestInput;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      setStatus({ kind: "invalid" });

      const firstInvalidField = Object.keys(fieldErrors)[0];
      document.getElementById(`class-${firstInvalidField}`)?.focus();
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const data = result.data;
    const classTitle = t(`items.${data.classId}.title`);
    const message = t("form.messageTemplate", {
      name: data.name,
      phone: data.phone,
      classTitle,
      message: data.message || "—",
    });

    // Só o canal e a aula — nenhum dado pessoal vai para o GA.
    trackEvent("generate_lead", { method: channel, class: data.classId });

    // Como no orçamento: nada passa por um backend nosso. O navegador abre o
    // WhatsApp/e-mail do visitante com a mensagem pronta (ver
    // docs/07-protecao-de-dados.md). Com "noopener", window.open sempre
    // devolve null — por isso a mensagem de sucesso traz um link manual.
    if (channel === "whatsapp") {
      const url = buildWhatsappUrl(message);
      window.open(url, "_blank", "noopener,noreferrer");
      setStatus({ kind: "sent", channel, url });
    } else {
      const url = buildMailtoUrl(t("form.emailSubject", { classTitle }), message);
      window.location.href = url;
      setStatus({ kind: "sent", channel, url });
    }

    resetTimeoutRef.current = setTimeout(() => setIsSubmitting(false), 1200);
  }

  function fieldError(field: keyof ClassInterestInput) {
    const key = errors[field];
    if (!key) return undefined;
    return key === "classRequired" ? t("form.classRequired") : tForm(`errors.${key}`);
  }

  function inputProps(field: keyof ClassInterestInput) {
    const error = fieldError(field);
    return {
      id: `class-${field}`,
      name: field,
      "aria-invalid": Boolean(error),
      "aria-describedby": error ? `class-${field}-error` : undefined,
      className: `${inputClasses} ${error ? invalidBorderClasses : validBorderClasses}`,
    };
  }

  return (
    <>
      <ul className="mt-14 grid gap-6 md:grid-cols-3">
        {classes.map(({ id }, index) => {
          const image = images[id];
          return (
            <li
              key={id}
              className="flex flex-col overflow-hidden rounded-sm border border-banquete-line bg-white"
            >
              {image ? (
                // alt vazio: o título logo abaixo já nomeia a aula
                <div className="relative aspect-[3/2] overflow-hidden bg-banquete-rose-soft">
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="(min-width: 1120px) 340px, (min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-[3/2] flex-col items-center justify-center gap-3 bg-banquete-rose-soft">
                  <Ornament />
                  <span className="font-serif text-base italic text-banquete-dark/70">
                    {t("imagePlaceholder")}
                  </span>
                </div>
              )}
              <div className="flex flex-1 flex-col px-6 pb-7 pt-6 text-center">
                <span aria-hidden="true" className="font-serif text-2xl italic text-banquete-gold-text">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2 className="mt-2 font-serif text-2xl leading-snug">{t(`items.${id}.title`)}</h2>
                {/* Descrição opcional: só aparece quando existir no dicionário */}
                {t.has(`items.${id}.description`) && (
                  <p className="mt-3 text-sm leading-relaxed text-banquete-dark/75">
                    {t(`items.${id}.description`)}
                  </p>
                )}
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-banquete-gold-text">
                  {t(`items.${id}.details`)}
                </p>
                <button
                  type="button"
                  onClick={() => chooseClass(id)}
                  className={`mt-auto pt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-banquete-rose underline-offset-[6px] hover:underline ${focusRing} rounded-sm`}
                >
                  {t("interestButton")}
                  <span className="sr-only"> — {t(`items.${id}.title`)}</span>
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <section id="inscricao" className="mx-auto mt-24 max-w-[560px] scroll-mt-24">
        <SectionHeader
          eyebrow={t("form.eyebrow")}
          title={t("form.heading")}
          intro={t("form.intro")}
        />

        <form noValidate onSubmit={(event) => event.preventDefault()} className="mt-10">
          <div className="mb-5">
            <label htmlFor="class-name" className={labelClasses}>
              {tForm("fields.name")}
            </label>
            <input
              {...inputProps("name")}
              ref={nameRef}
              type="text"
              autoComplete="name"
              maxLength={80}
              value={values.name}
              onChange={handleChange("name")}
            />
            <FieldError id="class-name-error" message={fieldError("name")} />
          </div>

          <div className="mb-5">
            <label htmlFor="class-phone" className={labelClasses}>
              {tForm("fields.phone")}
            </label>
            <input
              {...inputProps("phone")}
              type="tel"
              autoComplete="tel"
              placeholder={tForm("fields.phonePlaceholder")}
              maxLength={20}
              value={values.phone}
              onChange={handleChange("phone")}
            />
            <FieldError id="class-phone-error" message={fieldError("phone")} />
          </div>

          <div className="mb-5">
            <label htmlFor="class-classId" className={labelClasses}>
              {t("form.fieldClass")}
            </label>
            <select {...inputProps("classId")} value={values.classId} onChange={handleChange("classId")}>
              <option value="">{t("form.classPlaceholder")}</option>
              {classes.map(({ id }) => (
                <option key={id} value={id}>
                  {t(`items.${id}.title`)}
                </option>
              ))}
            </select>
            <FieldError id="class-classId-error" message={fieldError("classId")} />
          </div>

          <div className="mb-5">
            <label htmlFor="class-message" className={labelClasses}>
              {tForm("fields.message")}{" "}
              <span className="font-normal text-banquete-dark/70">{tForm("messageOptional")}</span>
            </label>
            <textarea
              {...inputProps("message")}
              rows={4}
              maxLength={500}
              value={values.message}
              onChange={handleChange("message")}
            />
            <FieldError id="class-message-error" message={fieldError("message")} />
          </div>

          <div className="mb-5">
            <div className="flex items-start gap-2.5">
              <input
                id="class-privacyAccepted"
                name="privacyAccepted"
                type="checkbox"
                checked={values.privacyAccepted}
                onChange={handleChange("privacyAccepted")}
                aria-invalid={Boolean(fieldError("privacyAccepted"))}
                aria-describedby={
                  fieldError("privacyAccepted") ? "class-privacyAccepted-error" : undefined
                }
                className="mt-1 h-4 w-4 shrink-0 accent-banquete-rose focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-banquete-rose"
              />
              <label htmlFor="class-privacyAccepted" className="text-sm">
                {tForm.rich("privacyConsent", {
                  link: (chunks) => (
                    <Link
                      href="/privacidade"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClasses}
                    >
                      {chunks}
                      <span className="sr-only"> {tForm("opensInNewTab")}</span>
                    </Link>
                  ),
                })}
              </label>
            </div>
            <FieldError id="class-privacyAccepted-error" message={fieldError("privacyAccepted")} />
          </div>

          <p className="mb-5 text-xs leading-relaxed text-banquete-dark/70">{tForm("privacyNote")}</p>

          <div className="flex flex-col gap-3 xs:flex-row">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => submit("whatsapp")}
              className={submitWhatsappClasses}
            >
              {isSubmitting ? tForm("submitting") : tForm("submitWhatsapp")}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => submit("email")}
              className={submitEmailClasses}
            >
              {isSubmitting ? tForm("submitting") : tForm("submitEmail")}
            </button>
          </div>

          <div role="status" aria-live="polite" className="mt-5">
            {status.kind === "sent" && (
              <p className="rounded-sm border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                <strong>{tForm("successTitle")}</strong>{" "}
                {status.channel === "whatsapp" ? tForm("successWhatsapp") : tForm("successEmail")}{" "}
                {tForm.rich(status.channel === "whatsapp" ? "fallbackWhatsapp" : "fallbackEmail", {
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
            <p role="alert" className="mt-5 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <strong>{tForm("errorTitle")}</strong> {tForm("errorGeneric")}
            </p>
          )}
        </form>
      </section>
    </>
  );
}
