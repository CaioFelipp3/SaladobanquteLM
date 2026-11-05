"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { gaMeasurementId } from "@/lib/analytics/config";
import {
  onConsentBannerOpen,
  readConsent,
  saveConsent,
  useConsent,
  type ConsentStatus,
} from "@/lib/analytics/consent";
import { disableGoogleAnalytics } from "@/lib/analytics/gtag";
import { Link } from "@/lib/i18n/navigation";
import { focusRing } from "@/lib/ui/styles";

const buttonClasses = `min-h-11 flex-1 rounded-sm px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors ${focusRing}`;

/**
 * Banner de consentimento de cookies (LGPD, art. 7º, I e art. 8º).
 *
 * - Aparece enquanto o visitante não decidiu (ou a decisão expirou) e quando
 *   ele clica em "Preferências de cookies" no rodapé.
 * - "Aceitar" e "Recusar" têm o mesmo peso visual: recusar não pode ser mais
 *   difícil que aceitar.
 * - Nada do Google carrega antes do "Aceitar" (ver GoogleAnalytics.tsx).
 * - Não é modal: o site continua utilizável com o banner aberto.
 */
export default function CookieBanner() {
  const t = useTranslations("CookieBanner");
  const consent = useConsent();
  const [reopened, setReopened] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      onConsentBannerOpen(() => {
        setReopened(true);
        // Espera o banner renderizar para mover o foco até ele — quem abriu
        // pelo teclado no rodapé continua de onde estava.
        requestAnimationFrame(() => regionRef.current?.focus());
      }),
    [],
  );

  if (!gaMeasurementId || consent === "pending" || (consent !== "unset" && !reopened)) {
    return null;
  }

  function decide(status: ConsentStatus) {
    const previous = readConsent();
    saveConsent(status);
    setReopened(false);

    // Revogação: o gtag.js já está rodando nesta página e não tem como ser
    // "descarregado". Apaga os cookies e recarrega para sair limpo.
    if (status === "denied" && previous === "granted") {
      disableGoogleAnalytics();
      window.location.reload();
    }
  }

  return (
    <div
      ref={regionRef}
      role="region"
      aria-labelledby="cookie-banner-title"
      tabIndex={-1}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-banquete-rose-soft-2 bg-banquete-bg px-5 py-4 shadow-[0_-4px_16px_rgba(61,43,53,0.12)] focus:outline-none sm:inset-x-auto sm:bottom-5 sm:left-5 sm:max-w-[420px] sm:rounded-sm sm:border"
    >
      <h2 id="cookie-banner-title" className="mb-1.5 font-serif text-xl leading-snug">
        {t("title")}
      </h2>
      <p className="mb-4 text-sm leading-relaxed">
        {t.rich("body", {
          link: (chunks) => (
            <Link
              href="/privacidade#cookies"
              className={`font-semibold text-banquete-rose underline underline-offset-2 ${focusRing}`}
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => decide("denied")}
          className={`${buttonClasses} border border-banquete-rose bg-white text-banquete-rose hover:bg-banquete-rose-soft`}
        >
          {t("reject")}
        </button>
        <button
          type="button"
          onClick={() => decide("granted")}
          className={`${buttonClasses} bg-banquete-rose text-white hover:bg-banquete-rose-dark`}
        >
          {t("accept")}
        </button>
      </div>
    </div>
  );
}
