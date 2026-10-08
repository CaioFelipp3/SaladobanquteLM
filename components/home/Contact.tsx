import { useTranslations } from "next-intl";
import WhatsappIcon from "@/components/icons/WhatsappIcon";
import { buildWhatsappUrl, contacts } from "@/lib/data/contacts";
import { sectionHeading } from "@/lib/ui/styles";

export default function Contact() {
  const t = useTranslations("Home.Contact");

  const items = [
    {
      id: "whatsapp",
      label: t("whatsappLabel"),
      href: buildWhatsappUrl(),
      external: true,
      content: (
        <>
          <WhatsappIcon size={18} fill="#25d366" className="mr-1.5 inline-block align-middle" />
          {t("whatsappLink")}
        </>
      ),
    },
    {
      id: "instagram",
      label: t("instagramLabel"),
      href: contacts.instagramUrl,
      external: true,
      content: <><span aria-hidden="true">📷 </span>{contacts.instagramHandle}</>,
    },
    {
      id: "email",
      label: t("emailLabel"),
      href: `mailto:${contacts.email}`,
      external: false,
      content: <><span aria-hidden="true">📧 </span>{contacts.email}</>,
    },
    {
      id: "address",
      label: t("addressLabel"),
      href: contacts.mapsUrl,
      external: true,
      content: <><span aria-hidden="true">📍 </span>{contacts.address}</>,
    },
  ];

  return (
    <section id="contato" className="mx-auto max-w-[900px] px-5 py-10">
      <h2 className={sectionHeading}>{t("heading")}</h2>
      <p className="mb-8 text-center text-[15px] text-banquete-dark">{t("intro")}</p>

      <div className="mx-auto max-w-[500px]">
        {items.map((item) => (
          <div
            key={item.id}
            className="my-4 rounded-[10px] border border-banquete-border bg-neutral-50 p-5"
          >
            <strong className="mb-2 block text-[11px] uppercase tracking-wide text-banquete-dark/70">
              {item.label}
            </strong>
            <a
              href={item.href}
              {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="text-banquete-rose hover:underline focus-visible:rounded-sm focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-banquete-rose"
            >
              {item.content}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
