import { useTranslations } from "next-intl";
import CookiePreferencesButton from "@/components/analytics/CookiePreferencesButton";
import WhatsappFloatButton from "@/components/layout/WhatsappFloatButton";
import Ornament from "@/components/ui/Ornament";
import { contacts } from "@/lib/data/contacts";
import { Link } from "@/lib/i18n/navigation";
import { eyebrowType, focusRingLight } from "@/lib/ui/styles";

const linkClasses = `rounded-sm underline underline-offset-4 transition-colors hover:text-white ${focusRingLight}`;

export default function Footer() {
  const t = useTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-banquete-dark text-[13px] leading-relaxed text-banquete-gold-light">
      <div className="mx-auto max-w-[1120px] px-5 pb-10 pt-16 text-center sm:px-8">
        <p className="font-serif text-3xl font-light text-white sm:text-4xl">Sala do Banquete</p>
        <p className={`${eyebrowType} mt-3 text-banquete-gold`}>Liliam Müller</p>
        <Ornament className="mt-6" />
        <p className="mt-6">{contacts.address}</p>

        <p className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-white/10 pt-8 text-xs">
          <span>
            © {year} Sala do Banquete – Liliam Müller. {t("rights")}
          </span>
          <Link href="/privacidade" className={linkClasses}>
            {t("privacy")}
          </Link>
          <CookiePreferencesButton label={t("cookiePreferences")} className={linkClasses} />
        </p>
      </div>
      {/* Fixo no canto da tela, mas dentro do <footer>: fora de uma região
          (landmark), quem navega por regiões no leitor de tela não o acha. */}
      <WhatsappFloatButton />
    </footer>
  );
}
