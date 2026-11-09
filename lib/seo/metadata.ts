import type { Metadata } from "next";
import { features } from "@/lib/features";
import { routing } from "@/lib/i18n/routing";

/** Domínio canônico — o sem-www redireciona para cá. */
export const siteUrl = "https://www.saladobanquetelm.com.br";
export const siteName = "A Sala do Banquete";
/**
 * Imagem de compartilhamento (WhatsApp, Instagram, Facebook): 1200×630, o
 * tamanho recomendado. Recorte da foto do hero.
 */
export const ogImage = {
  url: "/images/marca/compartilhamento.jpg",
  width: 1200,
  height: 630,
  alt: "Mesa posta da Sala do Banquete, em Vitória, ES",
};

/** Páginas públicas indexáveis, sem prefixo de idioma ("" = Home). */
export const pagePaths = [
  "",
  "/servicos",
  "/aulas",
  "/ebooks",
  "/orcamento",
  "/privacidade",
] as const;
export type PagePath = (typeof pagePaths)[number];

/** Páginas no ar agora: as desligadas em lib/features.ts ficam fora do sitemap. */
export const publishedPaths = pagePaths.filter(
  (path) => (path !== "/aulas" || features.classes) && (path !== "/ebooks" || features.ebooks),
);

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
