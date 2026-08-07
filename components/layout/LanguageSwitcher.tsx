import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { useLocale } from "next-intl";

const labels: Record<Locale, string> = {
  pt: "PT",
  en: "EN",
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
    <div className="flex items-center gap-2" aria-label={label}>
      {locales.map((locale, index) => (
        <span key={locale} className="flex items-center gap-2">
          {index > 0 && <span className="text-banquete-dark/30" aria-hidden="true">/</span>}
          <Link
            href={pathname}
            locale={locale}
            aria-current={locale === activeLocale ? "true" : undefined}
            className={`text-[13px] font-semibold uppercase tracking-wide transition-colors focus-visible:rounded-sm focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-banquete-rose ${
              locale === activeLocale
                ? "text-banquete-rose"
                : "text-banquete-dark hover:text-banquete-rose"
            }`}
          >
            {labels[locale]}
          </Link>
        </span>
      ))}
    </div>
  );
}
