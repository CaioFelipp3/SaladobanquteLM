import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { buttonPrimary, pageHeading } from "@/lib/ui/styles";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <section className="mx-auto max-w-[900px] px-5 py-20 text-center">
      <h1 className={pageHeading}>{t("heading")}</h1>
      <p className="mb-8 text-[15px] text-banquete-dark/70 xs:text-base">{t("body")}</p>
      <Link href="/" className={buttonPrimary}>
        {t("backHome")}
      </Link>
    </section>
  );
}
