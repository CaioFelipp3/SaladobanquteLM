import { useTranslations } from "next-intl";
import { InstagramIcon, MailIcon, MapPinIcon } from "@/components/icons/LineIcons";
import WhatsappIcon from "@/components/icons/WhatsappIcon";
import SectionHeader from "@/components/ui/SectionHeader";
import { buildWhatsappUrl, contacts } from "@/lib/data/contacts";
import { container, eyebrow, focusRing, sectionSpacing } from "@/lib/ui/styles";

export default function Contact() {
  const t = useTranslations("Home.Contact");

  const items = [
    {
      id: "whatsapp",
      label: t("whatsappLabel"),
      href: buildWhatsappUrl(),
      external: true,
      icon: <WhatsappIcon size={20} />,
      text: t("whatsappLink"),
    },
    {
      id: "instagram",
      label: t("instagramLabel"),
      href: contacts.instagramUrl,
      external: true,
      icon: <InstagramIcon size={22} />,
      text: contacts.instagramHandle,
    },
    {
      id: "email",
      label: t("emailLabel"),
      href: `mailto:${contacts.email}`,
      external: false,
      icon: <MailIcon size={22} />,
      text: contacts.email,
    },
    {
      id: "address",
      label: t("addressLabel"),
      href: contacts.mapsUrl,
      external: true,
      icon: <MapPinIcon size={22} />,
      text: contacts.address,
    },
  ];

  return (
    <section id="contato" className={`bg-white ${sectionSpacing}`}>
      <div className={container}>
        <SectionHeader eyebrow={t("eyebrow")} title={t("heading")} intro={t("intro")} />

        {/* gap-px sobre o fundo dourado-claro desenha os filetes entre os cards */}
        <ul className="mx-auto mt-14 grid max-w-[880px] gap-px overflow-hidden rounded-sm border border-banquete-line bg-banquete-line sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col items-center bg-white px-6 py-10 text-center">
              <span
                aria-hidden="true"
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-banquete-gold/70 text-banquete-gold-text"
              >
                {item.icon}
              </span>
              <span className={`${eyebrow} mb-3`}>{item.label}</span>
              <a
                href={item.href}
                {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={`break-words font-serif text-xl lining-nums text-banquete-dark underline decoration-banquete-gold/0 underline-offset-4 transition-colors duration-300 hover:text-banquete-rose hover:decoration-banquete-gold ${focusRing} rounded-sm`}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
