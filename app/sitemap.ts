import type { MetadataRoute } from "next";
import { routing } from "@/lib/i18n/routing";
import { languageAlternates, localizedPath, pagePaths, siteUrl } from "@/lib/seo/metadata";

// Uma entrada por página × idioma, cada uma apontando para as versões nos
// outros idiomas (hreflang) — é assim que o Google associa /servicos a
// /en/servicos em vez de tratá-las como conteúdo duplicado.
export default function sitemap(): MetadataRoute.Sitemap {
  return pagePaths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${siteUrl}${localizedPath(locale, path)}`,
      alternates: {
        languages: Object.fromEntries(
          Object.entries(languageAlternates(path)).map(([lang, href]) => [lang, `${siteUrl}${href}`]),
        ),
      },
    })),
  );
}
