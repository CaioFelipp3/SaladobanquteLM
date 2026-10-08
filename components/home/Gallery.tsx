"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRef, useState } from "react";

const TOTAL_IMAGES = 11;

// Client Component: carrossel precisa de estado (imagem atual) e de eventos
// de teclado/toque, que só existem no navegador.
export default function Gallery() {
  const t = useTranslations("Home.Gallery");
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);

  const goTo = (index: number) => {
    setCurrentIndex(((index % TOTAL_IMAGES) + TOTAL_IMAGES) % TOTAL_IMAGES);
  };

  const next = () => goTo(currentIndex + 1);
  const prev = () => goTo(currentIndex - 1);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") next();
    if (event.key === "ArrowLeft") prev();
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    const delta = touchStartX.current - event.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) {
      if (delta > 0) next();
      else prev();
    }
  };

  const imageNumber = currentIndex + 1;

  return (
    <section id="galeria" className="mx-auto max-w-[900px] px-5 py-10">
      <h2 className="mb-5 mt-0 font-serif text-[26px] leading-tight text-banquete-dark xs:text-3xl sm:text-4xl">
        {t("heading")}
      </h2>
      <p className="my-4 text-[15px] leading-relaxed text-banquete-dark xs:text-base">
        {t("intro")}
      </p>

      <div
        className="relative my-5 aspect-[3/4] min-h-60 w-full overflow-hidden rounded-[10px] bg-banquete-border focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-banquete-rose sm:aspect-[4/3]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="group"
        aria-roledescription={t("roledescription")}
        aria-label={t("heading")}
      >
        <Image
          key={imageNumber}
          src={`/assets/decoracao${imageNumber}.jpeg`}
          alt={t("imageAlt", { index: imageNumber })}
          fill
          sizes="(min-width: 768px) 900px, 100vw"
          className="select-none object-cover"
        />
      </div>

      <div className="my-5 flex justify-center gap-4">
        <button
          type="button"
          aria-label={t("prevLabel")}
          onClick={prev}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-banquete-rose text-xl text-white transition-colors hover:bg-banquete-rose-dark focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-banquete-rose"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label={t("nextLabel")}
          onClick={next}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-banquete-rose text-xl text-white transition-colors hover:bg-banquete-rose-dark focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-banquete-rose"
        >
          ›
        </button>
      </div>

      {/* Botões simples com aria-current em vez de role="tablist": um tablist
          exige painéis (tabpanel) e navegação por setas entre as abas, o que
          não existe aqui. Cada ponto tem área de toque de 24×24px (WCAG 2.5.8)
          com o círculo visível de 10px no centro. */}
      <div className="flex flex-wrap justify-center gap-1 py-1">
        {Array.from({ length: TOTAL_IMAGES }, (_, index) => (
          <button
            key={index}
            type="button"
            aria-label={t("dotLabel", { index: index + 1, total: TOTAL_IMAGES })}
            aria-current={index === currentIndex ? "true" : undefined}
            onClick={() => goTo(index)}
            className="group flex h-6 w-6 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-0 focus-visible:outline-banquete-rose"
          >
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 rounded-full border border-banquete-rose transition-colors ${
                index === currentIndex ? "bg-banquete-rose" : "bg-transparent group-hover:bg-banquete-rose-soft-2"
              }`}
            />
          </button>
        ))}
      </div>

      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {t("statusLabel", { index: imageNumber, total: TOTAL_IMAGES })}
      </span>
    </section>
  );
}
