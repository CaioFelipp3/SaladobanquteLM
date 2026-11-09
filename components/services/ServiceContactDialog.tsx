"use client";

import { useTranslations } from "next-intl";
import { MailIcon } from "@/components/icons/LineIcons";
import WhatsappIcon from "@/components/icons/WhatsappIcon";
import { buildMailtoUrl, buildWhatsappUrl } from "@/lib/data/contacts";
import type { ServiceId } from "@/lib/data/services";
import { focusRing } from "@/lib/ui/styles";

const optionClasses = `flex min-h-11 w-full items-center justify-center gap-2 rounded-sm px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition-colors ${focusRing}`;

/**
 * Popup "como prefere falar com a gente?" de um serviço. Usa o <dialog> nativo
 * aberto com showModal(): o navegador já prende o foco dentro dele, fecha com
 * Esc, escurece o fundo (::backdrop) e devolve o foco ao botão que o abriu.
 *
 * As duas opções são links de verdade (wa.me / mailto:) com a mensagem já
 * preenchida citando o serviço — o visitante só confere e envia. Nada passa
 * por um servidor nosso (ver docs/07-protecao-de-dados.md).
 */
export default function ServiceContactDialog({
  serviceId,
  ref,
}: {
  serviceId: ServiceId | null;
  ref: React.Ref<HTMLDialogElement>;
}) {
  const t = useTranslations("Services");
  const service = serviceId ? t(`items.${serviceId}.title`) : "";

  function close(event: React.SyntheticEvent) {
    (event.currentTarget.closest("dialog") as HTMLDialogElement | null)?.close();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="service-dialog-title"
      aria-describedby="service-dialog-intro"
      // Clique no fundo escurecido (fora do conteúdo) fecha o popup
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-[420px] rounded-sm bg-banquete-bg p-0 text-banquete-dark shadow-xl backdrop:bg-banquete-dark/60"
    >
      {serviceId && (
        <div className="relative px-6 pb-6 pt-8 text-center">
          <button
            type="button"
            onClick={close}
            aria-label={t("contact.close")}
            className={`absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-2xl leading-none text-banquete-dark/70 transition-colors hover:bg-banquete-rose-soft hover:text-banquete-dark ${focusRing}`}
          >
            <span aria-hidden="true">×</span>
          </button>

          <h2 id="service-dialog-title" className="mb-2 font-serif text-2xl leading-snug">
            <span className="block font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-banquete-dark/70">
              {t("contact.dialogLabel")}
            </span>
            {service}
          </h2>
          <p id="service-dialog-intro" className="mb-6 text-sm text-banquete-dark/70">
            {t("contact.dialogIntro")}
          </p>

          <div className="flex flex-col gap-3">
            <a
              href={buildWhatsappUrl(t("contact.whatsappMessage", { service }))}
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className={`${optionClasses} bg-whatsapp hover:bg-whatsapp-dark`}
            >
              <WhatsappIcon size={18} />
              {t("contact.whatsapp")}
              <span className="sr-only"> {t("contact.opensInNewTab")}</span>
            </a>
            <a
              href={buildMailtoUrl(
                t("contact.emailSubject", { service }),
                t("contact.emailBody", { service }),
              )}
              onClick={close}
              className={`${optionClasses} bg-banquete-rose hover:bg-banquete-rose-dark`}
            >
              <MailIcon size={18} />
              {t("contact.email")}
            </a>
          </div>
        </div>
      )}
    </dialog>
  );
}
