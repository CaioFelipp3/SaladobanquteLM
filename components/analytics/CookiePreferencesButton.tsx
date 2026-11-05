"use client";

import { gaMeasurementId } from "@/lib/analytics/config";
import { openConsentBanner } from "@/lib/analytics/consent";

/**
 * Link "Preferências de cookies" do rodapé: reabre o banner para o visitante
 * mudar de ideia a qualquer momento (revogar deve ser tão fácil quanto aceitar
 * — LGPD, art. 8º, § 5º). Sem Google Analytics configurado, não há o que
 * escolher e o link não aparece.
 */
export default function CookiePreferencesButton({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  if (!gaMeasurementId) return null;

  return (
    <button type="button" onClick={openConsentBanner} className={className}>
      {label}
    </button>
  );
}
