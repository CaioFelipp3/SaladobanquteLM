// Estilos e peças comuns aos formulários do site (orçamento e aulas), para
// os dois ficarem idênticos em aparência, foco e mensagens. Os textos vêm do
// namespace "Budget" dos dicionários, compartilhado pelos dois formulários.

import { useTranslations } from "next-intl";
import { contacts } from "@/lib/data/contacts";
import { Link } from "@/lib/i18n/navigation";

export const inputClasses =
  "w-full rounded-sm border bg-white px-4 py-2.5 text-[15px] placeholder:text-banquete-dark/70 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-1 focus-visible:outline-banquete-rose";
// Cor da borda em classes separadas: aplicar "border-banquete-border" e
// "border-red-500" juntas no mesmo elemento deixaria o resultado depender da
// ordem do CSS gerado, não da ordem no className.
export const validBorderClasses = "border-banquete-input-border focus:border-banquete-rose";
export const invalidBorderClasses = "border-red-500 focus:border-red-500";
export const linkClasses =
  "font-semibold text-banquete-rose underline underline-offset-2 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-banquete-rose";
export const labelClasses = "mb-1.5 block text-[13px] font-semibold";

const submitBase =
  "flex min-h-11 flex-1 items-center justify-center rounded-sm px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-banquete-rose disabled:cursor-not-allowed disabled:opacity-60";
const submitWhatsappClasses = `${submitBase} bg-whatsapp hover:bg-whatsapp-dark`;
const submitEmailClasses = `${submitBase} bg-banquete-rose hover:bg-banquete-rose-dark`;

export type Channel = "whatsapp" | "email";

export type SendStatus =
  | { kind: "idle" }
  | { kind: "invalid" }
  // Guarda a URL gerada para oferecer um link manual caso o navegador
  // bloqueie a nova aba ou não exista app de e-mail configurado.
  | { kind: "sent"; channel: Channel; url: string };

// Sem role="alert": no envio inválido o foco vai para o primeiro campo com
// erro, e o aria-describedby do campo já faz o leitor de tela ler a mensagem.
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-[13px] text-red-700">
      {message}
    </p>
  );
}

/** Checkbox de ciência da Política de Privacidade + aviso de que o envio sai do site. */
export function PrivacyConsent({
  idPrefix,
  checked,
  onChange,
  error,
}: {
  idPrefix: string;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}) {
  const t = useTranslations("Budget");
  const id = `${idPrefix}-privacyAccepted`;

  return (
    <>
      <div className="mb-5">
        <div className="flex items-start gap-2.5">
          <input
            id={id}
            name="privacyAccepted"
            type="checkbox"
            checked={checked}
            onChange={onChange}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
            className="mt-1 h-4 w-4 shrink-0 accent-banquete-rose focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-banquete-rose"
          />
          <label htmlFor={id} className="text-sm">
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
        <FieldError id={`${id}-error`} message={error} />
      </div>

      <p className="mb-5 text-xs leading-relaxed text-banquete-dark/70">{t("privacyNote")}</p>
    </>
  );
}

/** Botões "Enviar pelo WhatsApp" e "Enviar por e-mail". */
export function SubmitButtons({
  isSubmitting,
  onSubmit,
}: {
  isSubmitting: boolean;
  onSubmit: (channel: Channel) => void;
}) {
  const t = useTranslations("Budget");

  return (
    <div className="flex flex-col gap-3 xs:flex-row">
      <button
        type="button"
        disabled={isSubmitting}
        onClick={() => onSubmit("whatsapp")}
        className={submitWhatsappClasses}
      >
        {isSubmitting ? t("submitting") : t("submitWhatsapp")}
      </button>
      <button
        type="button"
        disabled={isSubmitting}
        onClick={() => onSubmit("email")}
        className={submitEmailClasses}
      >
        {isSubmitting ? t("submitting") : t("submitEmail")}
      </button>
    </div>
  );
}

/** Mensagem de sucesso (com link manual) ou de erro depois do envio. */
export function SendStatusMessage({ status }: { status: SendStatus }) {
  const t = useTranslations("Budget");

  return (
    <>
      <div role="status" aria-live="polite" className="mt-5">
        {status.kind === "sent" && (
          <p className="rounded-sm border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
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
        <p role="alert" className="mt-5 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <strong>{t("errorTitle")}</strong> {t("errorGeneric")}
        </p>
      )}
    </>
  );
}
