import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <section className="mx-auto max-w-[900px] px-5 py-20 text-center">
      <h1 className="mb-4 mt-0 font-serif text-[30px] leading-tight text-banquete-dark xs:text-4xl sm:text-5xl">
        {t("heading")}
      </h1>
      <p className="mb-8 text-[15px] text-banquete-dark/70 xs:text-base">{t("body")}</p>
      <Link
        href="/"
        className="inline-block min-h-11 rounded-md bg-banquete-rose px-5 py-3 text-xs font-semibold uppercase text-white transition-colors hover:bg-banquete-rose-dark focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-banquete-rose"
      >
        {t("backHome")}
      </Link>
    </section>
  );
}
