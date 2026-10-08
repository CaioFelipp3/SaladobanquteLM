import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";

export default function Footer() {
  const t = useTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-banquete-dark px-5 py-7 text-center text-[13px] leading-relaxed text-banquete-gold-light">
      <p>
        © {year} Sala do Banquete – Liliam Müller. {t("rights")}
      </p>
      <p className="mt-2">
        <Link
          href="/privacidade"
          className="underline underline-offset-2 hover:text-white focus-visible:rounded-sm focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-banquete-gold"
        >
          {t("privacy")}
        </Link>
      </p>
    </footer>
  );
}
