import { useTranslations } from "next-intl";
import Image from "next/image";

export default function About() {
  const t = useTranslations("Home.About");

  return (
    <section id="sobre" className="mx-auto max-w-[900px] scroll-mt-16 px-5 py-10">
      <h2 className="mb-5 mt-0 font-serif text-[26px] leading-tight text-banquete-dark xs:text-3xl sm:text-4xl">
        {t("heading")}
      </h2>
      <p className="my-4 text-[15px] leading-relaxed text-banquete-dark xs:text-base">
        {t("paragraph1")}
      </p>
      <p className="my-4 text-[15px] leading-relaxed text-banquete-dark xs:text-base">
        {t("paragraph2")}
      </p>

      <div className="mx-auto mt-8 max-w-[700px]">
        <div className="relative aspect-[4/3] min-h-[180px] w-full overflow-hidden rounded-[10px] bg-banquete-border">
          <Image
            src="/assets/liliam.jpg"
            alt={t("founderImageAlt")}
            fill
            sizes="(min-width: 768px) 700px, 100vw"
            className="object-cover"
          />
        </div>
        <p className="mt-1.5 text-center text-[13px] italic text-banquete-dark/70">
          {t("founderCaption")}
        </p>
      </div>
    </section>
  );
}
