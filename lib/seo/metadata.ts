import type { Metadata } from "next";
import { routing } from "@/lib/i18n/routing";

/** Domínio canônico — o sem-www redireciona para cá. */
export const siteUrl = "https://www.saladobanquetelm.com.br";
export const siteName = "A Sala do Banquete";
const ogImage = "/images/marca/logo.png";

/** Páginas públicas indexáveis, sem prefixo de idioma ("" = Home). */
export const pagePaths = ["", "/servicos", "/orcamento", "/privacidade"] as const;
export type PagePath = (typeof pagePaths)[number];

/** "/servicos" em pt → "/servicos"; em en → "/en/servicos". */
export function localizedPath(locale: string, path: PagePath): string {
  if (locale === routing.defaultLocale) return path || "/";
  return `/${locale}${path}`;
}

/** Mapa hreflang → URL de cada idioma, mais x-default (idioma padrão). */
export function languageAlternates(path: PagePath): Record<string, string> {
  return {
    ...Object.fromEntries(routing.locales.map((locale) => [locale, localizedPath(locale, path)])),
    "x-default": localizedPath(routing.defaultLocale, path),
  };
}

/**
 * Metadata completa de uma página: canonical, alternates por idioma, Open
 * Graph e Twitter. Cada página precisa declarar tudo isso — o Next.js faz
 * merge raso, então um openGraph/twitter herdado do layout manteria o título
 * da Home ao compartilhar o link de outra página.
 */
export function buildPageMetadata({
  locale,
  path,
  title,
  description,
}: {
  locale: string;
  path: PagePath;
  title: string;
  description: string;
}): Metadata {
  const url = localizedPath(locale, path);

  return {
    title,
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      title,
      description,
      url,
      siteName,
      images: [ogImage],
      locale: locale === "pt" ? "pt_BR" : "en_US",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}
