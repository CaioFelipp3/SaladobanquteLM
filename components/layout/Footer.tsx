import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-banquete-dark px-5 py-7 text-center text-[13px] leading-relaxed text-banquete-gold-light">
      <p>
        © {year} Sala do Banquete – Liliam Müller. {t("rights")}
      </p>
    </footer>
  );
}
