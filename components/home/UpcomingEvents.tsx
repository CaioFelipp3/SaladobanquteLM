import { useLocale, useTranslations } from "next-intl";
import TicketCheckout from "@/components/tickets/TicketCheckout";
import Ornament from "@/components/ui/Ornament";
import SectionHeader from "@/components/ui/SectionHeader";
import { buildWhatsappUrl } from "@/lib/data/contacts";
import { ticketSales } from "@/lib/data/tickets";
import { salesOpen } from "@/lib/payments/mercadopago";
import { buttonOutline, buttonPrimary, container, eyebrow, sectionSpacing } from "@/lib/ui/styles";

export default function UpcomingEvents() {
  const t = useTranslations("Home.Events");
  const tTickets = useTranslations("Tickets");
  const locale = useLocale() as "pt" | "en";

  return (
    <section id="eventos" className={`bg-white ${sectionSpacing}`}>
      <div className={container}>
        <SectionHeader eyebrow={t("eyebrow")} title={t("heading")} intro={t("intro")} />

        <article className="mx-auto mt-14 grid max-w-[920px] overflow-hidden rounded-sm border border-banquete-line bg-banquete-bg md:grid-cols-2">
          <div className="flex aspect-[4/3] flex-col items-center justify-center gap-4 bg-banquete-rose-soft text-center md:aspect-auto md:min-h-[380px]">
            <Ornament />
            <span className="font-serif text-lg italic text-banquete-dark/70">
              {t("chaDasFlores.imagePlaceholder")}
            </span>
          </div>
          <div className="flex flex-col p-8 sm:p-10">
            <p className={eyebrow}>{t("chaDasFlores.date")}</p>
            <h3 className="mt-4 font-serif text-3xl font-light leading-tight sm:text-4xl">
              {t("chaDasFlores.title")}
            </h3>
            <p className="mb-8 mt-4 text-[15px] leading-[1.8] text-banquete-dark/80">
              {t("chaDasFlores.description")}
            </p>
            {/* Vendas abertas (ingressos no catálogo + token configurado):
                compra pelo Mercado Pago. Senão, segue pelo WhatsApp. */}
            {salesOpen() ? (
              <TicketCheckout
                eventName={ticketSales.eventName[locale]}
                tickets={ticketSales.tickets}
                maxPerPurchase={ticketSales.maxPerPurchase}
                buttonLabel={t("chaDasFlores.ctaButton")}
                whatsappHref={buildWhatsappUrl(
                  tTickets("whatsappMessage", { event: ticketSales.eventName[locale] }),
                )}
              />
            ) : (
              <a
                href={buildWhatsappUrl(t("chaDasFlores.ctaMessage"))}
                target="_blank"
                rel="noopener noreferrer"
                className={`${buttonPrimary} mt-auto`}
              >
                {t("chaDasFlores.ctaButton")}
              </a>
            )}
          </div>
        </article>

        <div className="mt-12 text-center">
          <a
            href={buildWhatsappUrl(t("ctaMessage"))}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonOutline}
          >
            {t("ctaButton")}
          </a>
        </div>
      </div>
    </section>
  );
}
