import { useTranslations } from "next-intl";
import Image from "next/image";
import { bodyText, sectionHeading } from "@/lib/ui/styles";

export default function About() {
  const t = useTranslations("Home.About");

  return (
    <section id="sobre" className="mx-auto max-w-[900px] px-5 py-10">
      <h2 className={sectionHeading}>{t("heading")}</h2>
      <p className={bodyText}>{t("paragraph1")}</p>
      <p className={bodyText}>{t("paragraph2")}</p>

      <div className="mx-auto mt-8 max-w-[700px]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] bg-banquete-border">
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
