import { useLocale } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";

// Sigla visível + nome do idioma nele mesmo (endônimo) para leitores de tela:
// quem procura "English" encontra "English", não "Inglês".
const labels: Record<Locale, { short: string; name: string }> = {
  pt: { short: "PT", name: "Português" },
  en: { short: "EN", name: "English" },
};

export default function LanguageSwitcher({
  pathname,
  locales,
  label,
}: {
  pathname: string;
  locales: readonly Locale[];
  label: string;
}) {
  const activeLocale = useLocale();

  return (
    <div role="group" className="flex items-center gap-2" aria-label={label}>
      {locales.map((locale, index) => (
        <span key={locale} className="flex items-center gap-2">
          {index > 0 && <span className="text-banquete-dark/30" aria-hidden="true">/</span>}
          <Link
            href={pathname}
            locale={locale}
            lang={locale === "pt" ? "pt-BR" : locale}
            hrefLang={locale === "pt" ? "pt-BR" : locale}
            aria-label={labels[locale].name}
            aria-current={locale === activeLocale ? "true" : undefined}
            className={`text-[13px] font-semibold uppercase tracking-wide transition-colors focus-visible:rounded-sm focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-banquete-rose ${
              locale === activeLocale
                ? "text-banquete-rose"
                : "hover:text-banquete-rose"
            }`}
          >
            {labels[locale].short}
          </Link>
        </span>
      ))}
    </div>
  );
}
