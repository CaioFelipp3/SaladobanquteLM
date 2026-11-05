import { useTranslations } from "next-intl";
import Image from "next/image";
import SectionHeader from "@/components/ui/SectionHeader";
import { bodyText, container, sectionSpacing } from "@/lib/ui/styles";

export default function About() {
  const t = useTranslations("Home.About");

  return (
    <section id="sobre" className={sectionSpacing}>
      <div className={`${container} grid items-center gap-14 md:grid-cols-2 md:gap-16 lg:gap-24`}>
        {/* Moldura dourada deslocada atrás da foto. O deslocamento (12px/20px)
            é menor que o respiro lateral da seção, então não gera rolagem
            horizontal no celular. */}
        <div className="relative mr-3 mb-3 sm:mr-5 sm:mb-5">
          <div
            aria-hidden="true"
            className="absolute inset-0 translate-x-3 translate-y-3 border border-banquete-gold/70 sm:translate-x-5 sm:translate-y-5"
          />
          <div className="relative aspect-[4/5] overflow-hidden bg-banquete-border">
            <Image
              src="/images/equipe/liliam.jpg"
              alt={t("founderImageAlt")}
              fill
              sizes="(min-width: 768px) 520px, 100vw"
              className="object-cover"
            />
          </div>
        </div>

        <div>
          <SectionHeader eyebrow={t("eyebrow")} title={t("heading")} align="left" />
          <div className="mt-4">
            <p className={bodyText}>{t("paragraph1")}</p>
            <p className={bodyText}>{t("paragraph2")}</p>
          </div>
          <p className="mt-8 font-serif text-2xl italic text-banquete-rose">
            {t("founderCaption")}
          </p>
        </div>
      </div>
    </section>
  );
}
