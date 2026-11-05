import { useTranslations } from "next-intl";
import Image from "next/image";
import Ornament from "@/components/ui/Ornament";
import { Link } from "@/lib/i18n/navigation";
import { buttonShape, eyebrowType, focusRingLight } from "@/lib/ui/styles";

export default function Hero() {
  const t = useTranslations("Home.Hero");

  return (
    // Foto de mesa posta ocupando a primeira tela, escurecida pelo degradê
    // para o texto branco manter contraste em qualquer recorte da imagem.
    <section
      id="home"
      className="relative isolate flex min-h-[calc(100svh-4rem)] items-center justify-center overflow-hidden bg-banquete-dark px-5 py-24 text-center text-white"
    >
      <Image
        src="/images/galeria/1.jpeg"
        alt=""
        fill
        preload
        sizes="100vw"
        className="-z-20 object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-b from-banquete-dark/80 via-banquete-dark/60 to-banquete-dark/85"
      />

      <div className="max-w-[760px] animate-fade-up">
        <p className={`${eyebrowType} text-banquete-gold`}>{t("eyebrow")}</p>
        <h1 className="mt-6 text-balance font-serif text-[44px] font-light leading-[1.05] xs:text-5xl sm:text-6xl md:text-7xl">
          {t("title")}
        </h1>
        <Ornament className="mt-8" />
        <p className="mx-auto mt-8 max-w-[520px] text-[15px] leading-relaxed text-white/85 sm:text-base">
          {t("subtitle")}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 xs:flex-row">
          <Link
            href="/orcamento"
            className={`${buttonShape} ${focusRingLight} w-full bg-banquete-rose text-white hover:bg-banquete-rose-dark xs:w-auto`}
          >
            {t("ctaPrimary")}
          </Link>
          <Link
            href="/#eventos"
            className={`${buttonShape} ${focusRingLight} w-full border border-white/70 text-white hover:bg-white hover:text-banquete-dark xs:w-auto`}
          >
            {t("ctaSecondary")}
          </Link>
        </div>
      </div>
    </section>
  );
}
