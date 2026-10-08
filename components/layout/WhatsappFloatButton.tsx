import { useTranslations } from "next-intl";
import WhatsappIcon from "@/components/icons/WhatsappIcon";
import { buildWhatsappUrl } from "@/lib/data/contacts";

export default function WhatsappFloatButton() {
  const t = useTranslations("WhatsappFloat");

  return (
    <a
      href={buildWhatsappUrl(t("message"))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("ariaLabel")}
      className="fixed bottom-5 right-5 z-40 flex h-[54px] w-[54px] items-center justify-center rounded-full bg-whatsapp text-white shadow-lg transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-banquete-rose sm:bottom-7 sm:right-7"
    >
      <WhatsappIcon size={28} fill="white" />
    </a>
  );
}
