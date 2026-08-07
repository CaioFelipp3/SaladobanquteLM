import { useTranslations } from "next-intl";
import { buildWhatsappUrl } from "@/lib/data/contacts";

export default function UpcomingEvents() {
  const t = useTranslations("Home.Events");

  return (
    <section id="eventos" className="mx-auto max-w-[900px] scroll-mt-16 px-5 py-10">
      <h2 className="mb-5 mt-0 font-serif text-[26px] leading-tight text-banquete-dark xs:text-3xl sm:text-4xl">
        {t("heading")}
      </h2>
      <p className="my-4 text-[15px] leading-relaxed text-banquete-dark xs:text-base">
        {t("intro")}
      </p>
      <a
        href={buildWhatsappUrl(t("ctaMessage"))}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2.5 inline-block min-h-11 rounded-md bg-banquete-rose px-5 py-3 text-xs font-semibold uppercase text-white transition-colors hover:bg-banquete-rose-dark focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-banquete-rose"
      >
        {t("ctaButton")}
      </a>

      <div className="mt-8 flex flex-col gap-5 xs:flex-row xs:flex-wrap">
        <div className="flex flex-1 flex-col overflow-hidden rounded-[10px] border border-banquete-border bg-white xs:min-w-[260px]">
          <div className="flex aspect-[3/2] w-full items-center justify-center bg-banquete-rose-soft text-center text-sm text-banquete-dark/50 xs:aspect-square">
            {t("chaDasFlores.imagePlaceholder")}
          </div>
          <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
            <h3 className="mb-2.5 font-serif text-lg leading-snug text-banquete-dark">
              {t("chaDasFlores.title")}
            </h3>
            <div className="mb-2.5 text-xs font-semibold uppercase text-banquete-gold">
              {t("chaDasFlores.date")}
            </div>
            <p className="my-2.5 text-sm text-banquete-dark">
              {t("chaDasFlores.description")}
            </p>
            <a
              href={buildWhatsappUrl(t("chaDasFlores.ctaMessage"))}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-block min-h-11 rounded-md bg-banquete-rose px-5 py-3 text-center text-xs font-semibold uppercase text-white transition-colors hover:bg-banquete-rose-dark focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-banquete-rose"
            >
              {t("chaDasFlores.ctaButton")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
