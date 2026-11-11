"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  FieldError,
  labelClasses,
  PrivacyConsent,
  SendStatusMessage,
  SubmitButtons,
} from "@/components/forms/FormParts";
import { useContactForm } from "@/components/forms/useContactForm";
import { services } from "@/lib/data/services";
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

export default function BudgetForm() {
  const t = useTranslations("Budget");
  const tServices = useTranslations("Services");
  const locale = useLocale();

  function formatEventDate(iso: string) {
    return parseLocalDate(iso).toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  const form = useContactForm({
    initialValues: emptyValues,
    schema: budgetFormSchema,
    idPrefix: "budget",
    translateError: (key) => t(`errors.${key}`),
    compose: (data) => {
      const serviceTitle = tServices(`items.${data.service}.title`);
      return {
        message: t("messageTemplate", {
          name: data.name,
          phone: data.phone,
          service: serviceTitle,
          eventDate: formatEventDate(data.eventDate),
          guestCount: data.guestCount,
          message: data.message || "—",
        }),
        subject: t("emailSubject", { service: serviceTitle }),
        // Só o tipo de serviço — nenhum dado pessoal vai para o GA.
        analytics: { service: data.service },
      };
    },
  });

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
          {...form.inputProps("name")}
          type="text"
          autoComplete="name"
          maxLength={80}
          value={form.values.name}
          onChange={form.handleChange("name")}
        />
        <FieldError id="budget-name-error" message={form.fieldError("name")} />
      </div>

      <div className="mb-5">
        <label htmlFor="budget-phone" className={labelClasses}>
          {t("fields.phone")}
        </label>
        <input
          {...form.inputProps("phone")}
          type="tel"
          autoComplete="tel"
          placeholder={t("fields.phonePlaceholder")}
          maxLength={20}
          value={form.values.phone}
          onChange={form.handleChange("phone")}
        />
        <FieldError id="budget-phone-error" message={form.fieldError("phone")} />
      </div>

      <div className="mb-5">
        <label htmlFor="budget-service" className={labelClasses}>
          {t("fields.service")}
        </label>
        <select
          {...form.inputProps("service")}
          value={form.values.service}
          onChange={form.handleChange("service")}
        >
          <option value="">{t("fields.servicePlaceholder")}</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {tServices(`items.${service.id}.title`)}
            </option>
          ))}
        </select>
        <FieldError id="budget-service-error" message={form.fieldError("service")} />
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
          {...form.inputProps("eventDate")}
          type="date"
          value={form.values.eventDate}
          onChange={form.handleChange("eventDate")}
        />
        <FieldError id="budget-eventDate-error" message={form.fieldError("eventDate")} />
      </div>

      <div className="mb-5">
        <label htmlFor="budget-guestCount" className={labelClasses}>
          {t("fields.guestCount")}
        </label>
        <input
          {...form.inputProps("guestCount")}
          type="number"
          inputMode="numeric"
          min={1}
          max={1000}
          value={form.values.guestCount}
          onChange={form.handleChange("guestCount")}
        />
        <FieldError id="budget-guestCount-error" message={form.fieldError("guestCount")} />
      </div>

      <div className="mb-5">
        <label htmlFor="budget-message" className={labelClasses}>
          {t("fields.message")} <span className="font-normal text-banquete-dark/70">{t("messageOptional")}</span>
        </label>
        <textarea
          {...form.inputProps("message")}
          rows={4}
          maxLength={500}
          value={form.values.message}
          onChange={form.handleChange("message")}
        />
        <FieldError id="budget-message-error" message={form.fieldError("message")} />
      </div>

      <PrivacyConsent
        idPrefix="budget"
        checked={form.values.privacyAccepted}
        onChange={form.handleChange("privacyAccepted")}
        error={form.fieldError("privacyAccepted")}
      />

      <SubmitButtons isSubmitting={form.isSubmitting} onSubmit={form.submit} />

      <SendStatusMessage status={form.status} />
    </form>
  );
}
