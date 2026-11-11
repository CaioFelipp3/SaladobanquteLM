"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRef } from "react";
import {
  FieldError,
  labelClasses,
  PrivacyConsent,
  SendStatusMessage,
  SubmitButtons,
} from "@/components/forms/FormParts";
import { useContactForm } from "@/components/forms/useContactForm";
import Ornament from "@/components/ui/Ornament";
import SectionHeader from "@/components/ui/SectionHeader";
import { classes, type ClassId } from "@/lib/data/classes";
import { focusRing } from "@/lib/ui/styles";
import { classInterestSchema, type ClassInterestInput } from "@/lib/validation/classInterest";

const emptyValues: ClassInterestInput = {
  name: "",
  phone: "",
  classId: "",
  message: "",
  privacyAccepted: false,
};

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
  const nameRef = useRef<HTMLInputElement>(null);

  const form = useContactForm({
    initialValues: emptyValues,
    schema: classInterestSchema,
    idPrefix: "class",
    translateError: (key) =>
      key === "classRequired" ? t("form.classRequired") : tForm(`errors.${key}`),
    compose: (data) => {
      const classTitle = t(`items.${data.classId}.title`);
      return {
        message: t("form.messageTemplate", {
          name: data.name,
          phone: data.phone,
          classTitle,
          message: data.message || "—",
        }),
        subject: t("form.emailSubject", { classTitle }),
        // Só a aula — nenhum dado pessoal vai para o GA.
        analytics: { class: data.classId },
      };
    },
  });

  function chooseClass(id: ClassId) {
    form.setField("classId", id);
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
              {...form.inputProps("name")}
              ref={nameRef}
              type="text"
              autoComplete="name"
              maxLength={80}
              value={form.values.name}
              onChange={form.handleChange("name")}
            />
            <FieldError id="class-name-error" message={form.fieldError("name")} />
          </div>

          <div className="mb-5">
            <label htmlFor="class-phone" className={labelClasses}>
              {tForm("fields.phone")}
            </label>
            <input
              {...form.inputProps("phone")}
              type="tel"
              autoComplete="tel"
              placeholder={tForm("fields.phonePlaceholder")}
              maxLength={20}
              value={form.values.phone}
              onChange={form.handleChange("phone")}
            />
            <FieldError id="class-phone-error" message={form.fieldError("phone")} />
          </div>

          <div className="mb-5">
            <label htmlFor="class-classId" className={labelClasses}>
              {t("form.fieldClass")}
            </label>
            <select
              {...form.inputProps("classId")}
              value={form.values.classId}
              onChange={form.handleChange("classId")}
            >
              <option value="">{t("form.classPlaceholder")}</option>
              {classes.map(({ id }) => (
                <option key={id} value={id}>
                  {t(`items.${id}.title`)}
                </option>
              ))}
            </select>
            <FieldError id="class-classId-error" message={form.fieldError("classId")} />
          </div>

          <div className="mb-5">
            <label htmlFor="class-message" className={labelClasses}>
              {tForm("fields.message")}{" "}
              <span className="font-normal text-banquete-dark/70">{tForm("messageOptional")}</span>
            </label>
            <textarea
              {...form.inputProps("message")}
              rows={4}
              maxLength={500}
              value={form.values.message}
              onChange={form.handleChange("message")}
            />
            <FieldError id="class-message-error" message={form.fieldError("message")} />
          </div>

          <PrivacyConsent
            idPrefix="class"
            checked={form.values.privacyAccepted}
            onChange={form.handleChange("privacyAccepted")}
            error={form.fieldError("privacyAccepted")}
          />

          <SubmitButtons isSubmitting={form.isSubmitting} onSubmit={form.submit} />

          <SendStatusMessage status={form.status} />
        </form>
      </section>
    </>
  );
}
