"use client";

import { useEffect } from "react";
import { useConsent } from "@/lib/analytics/consent";
import { loadGoogleAnalytics } from "@/lib/analytics/gtag";

/**
 * Carrega o Google Analytics assim que existir consentimento — na primeira
 * visita, logo após o clique em "Aceitar"; nas seguintes, ao abrir a página.
 * Não renderiza nada: o script é injetado no <head> por loadGoogleAnalytics.
 *
 * Por que não next/script: o script só pode existir depois do consentimento,
 * e a fila do dataLayer precisa estar montada antes dele carregar. Injetar à
 * mão deixa essa ordem explícita.
 *
 * Page views: a medição otimizada do GA4 (ligada por padrão na propriedade)
 * registra as navegações internas do Next pelo History API.
 */
export default function GoogleAnalytics() {
  const consent = useConsent();

  useEffect(() => {
    if (consent === "granted") loadGoogleAnalytics();
  }, [consent]);

  return null;
}
