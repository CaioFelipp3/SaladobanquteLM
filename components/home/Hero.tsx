import { useTranslations } from "next-intl";
import Image from "next/image";

export default function Hero() {
  const t = useTranslations("Home.Hero");

  return (
    <section id="home" className="mx-auto max-w-[900px] px-5 pt-16">
      <div className="my-8 text-center">
        <Image
          src="/assets/logo.png"
          alt={t("logoAlt")}
          width={300}
          height={140}
          preload
          className="mx-auto h-auto w-full max-w-[300px]"
        />
      </div>
      <h1 className="my-2 text-center font-serif text-[30px] leading-tight xs:text-4xl sm:text-[40px] md:text-5xl">
        {t("title")}
      </h1>
      <p className="mb-8 text-center text-[15px] text-banquete-dark/70">
        {t("subtitle")}
      </p>
    </section>
  );
}
