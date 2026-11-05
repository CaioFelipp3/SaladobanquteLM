import { gaMeasurementId } from "./config";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

// Os cookies do GA expiram junto com a escolha do banner (12 meses), em vez
// dos 2 anos padrão do Google: depois disso o visitante decide de novo.
const COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

/**
 * Carrega o gtag.js. Só é chamado depois que o visitante aceita os cookies;
 * antes disso, nenhum script ou requisição vai para o Google.
 */
export function loadGoogleAnalytics() {
  if (!gaMeasurementId || window.gtag) return;

  window.dataLayer = window.dataLayer ?? [];
  // O gtag.js exige o objeto `arguments` original, não um array — por isso
  // function em vez de arrow function com rest params.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };

  // Consent Mode: o visitante aceitou só a análise. Recursos de publicidade
  // (remarketing, personalização de anúncios) ficam desligados.
  window.gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.gtag("js", new Date());
  window.gtag("config", gaMeasurementId, {
    cookie_expires: COOKIE_MAX_AGE_SECONDS,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`;
  document.head.appendChild(script);
}

/**
 * Para de coletar e apaga os cookies do GA (_ga, _ga_<id>) quando o visitante
 * revoga o consentimento. O GA grava os cookies no domínio principal
 * (ex: .saladobanquetelm.com.br), então tenta cada nível do domínio atual.
 */
export function disableGoogleAnalytics() {
  if (gaMeasurementId) {
    (window as unknown as Record<string, boolean>)[`ga-disable-${gaMeasurementId}`] = true;
  }

  const names = document.cookie
    .split(";")
    .map((cookie) => cookie.split("=")[0].trim())
    .filter((name) => name === "_ga" || name.startsWith("_ga_"));

  const parts = window.location.hostname.split(".");
  const domains = [""];
  for (let i = 0; i < parts.length - 1; i++) {
    domains.push(`; domain=.${parts.slice(i).join(".")}`);
  }

  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
    }
  }
}

/**
 * Envia um evento ao GA. Sem consentimento o gtag não existe e a chamada não
 * faz nada — os componentes podem chamar sem checar o consentimento.
 * Nunca enviar dados pessoais (nome, telefone, e-mail) nos parâmetros.
 */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  window.gtag?.("event", name, params);
}
