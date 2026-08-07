import { defineRouting } from "next-intl/routing";

// pt é o idioma padrão: aparece em "/", sem prefixo (mantém a URL raiz igual ao site atual).
// en usa prefixo: "/en", "/en/servicos", etc.
export const routing = defineRouting({
  locales: ["pt", "en"],
  defaultLocale: "pt",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
