import { useTranslations } from "next-intl";
import { buildWhatsappUrl } from "@/lib/data/contacts";
import { bodyText, buttonPrimary, sectionHeading } from "@/lib/ui/styles";

export default function UpcomingEvents() {
  const t = useTranslations("Home.Events");

  return (
    <section id="eventos" className="mx-auto max-w-[900px] px-5 py-10">
      <h2 className={sectionHeading}>{t("heading")}</h2>
      <p className={bodyText}>{t("intro")}</p>
      <a
        href={buildWhatsappUrl(t("ctaMessage"))}
        target="_blank"
        rel="noopener noreferrer"
        className={`${buttonPrimary} mt-2.5`}
      >
        {t("ctaButton")}
      </a>

      <div className="mt-8 flex flex-col gap-5 xs:flex-row xs:flex-wrap">
        <div className="flex flex-1 flex-col overflow-hidden rounded-[10px] border border-banquete-border bg-white xs:min-w-[260px] xs:max-w-[420px]">
          <div className="flex aspect-[3/2] items-center justify-center bg-banquete-rose-soft text-center text-sm text-banquete-dark/70 xs:aspect-square">
            {t("chaDasFlores.imagePlaceholder")}
          </div>
          <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
            <h3 className="mb-2.5 font-serif text-lg leading-snug">
              {t("chaDasFlores.title")}
            </h3>
            <div className="mb-2.5 text-xs font-semibold uppercase text-banquete-gold-text">
              {t("chaDasFlores.date")}
            </div>
            <p className="my-2.5 text-sm">
              {t("chaDasFlores.description")}
            </p>
            <a
              href={buildWhatsappUrl(t("chaDasFlores.ctaMessage"))}
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonPrimary} mt-auto text-center`}
            >
              {t("chaDasFlores.ctaButton")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
