"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronIcon } from "@/components/icons/LineIcons";
import SectionHeader from "@/components/ui/SectionHeader";
import { container, focusRing, sectionSpacing } from "@/lib/ui/styles";

const TOTAL_IMAGES = 11;

const arrowButton = `flex h-12 w-12 items-center justify-center rounded-full border border-banquete-dark/40 text-banquete-dark transition-colors duration-300 hover:border-banquete-dark hover:bg-banquete-dark hover:text-white ${focusRing}`;

const pad = (n: number) => String(n).padStart(2, "0");

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
    <section id="galeria" className={`${container} ${sectionSpacing}`}>
      <SectionHeader eyebrow={t("eyebrow")} title={t("heading")} intro={t("intro")} />

      <div
        className={`relative mt-14 aspect-[3/4] overflow-hidden rounded-sm bg-banquete-border sm:aspect-[16/10] ${focusRing}`}
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
          src={`/images/galeria/${imageNumber}.jpeg`}
          alt={t("imageAlt", { index: imageNumber })}
          fill
          sizes="(min-width: 1120px) 1060px, 100vw"
          className="select-none object-cover"
        />
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        {/* Contador visual "01 / 11"; o leitor de tela ouve o aria-live abaixo. */}
        <p aria-hidden="true" className="font-serif text-xl lining-nums tabular-nums">
          <span className="text-banquete-rose">{pad(imageNumber)}</span>
          {/* /70: com /50 o contraste ficava em 2,8:1 (mínimo WCAG 4,5:1) */}
          <span className="text-banquete-dark/70"> / {pad(TOTAL_IMAGES)}</span>
        </p>

        {/* Botões simples com aria-current em vez de role="tablist": um tablist
            exige painéis (tabpanel) e navegação por setas entre as abas, o que
            não existe aqui. Cada traço tem área de toque de 24×24px (WCAG 2.5.8).
            No celular não cabem ao lado do contador — setas e o gesto de
            arrastar continuam navegando. */}
        <div className="hidden flex-wrap justify-center sm:flex">
          {Array.from({ length: TOTAL_IMAGES }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={t("dotLabel", { index: index + 1, total: TOTAL_IMAGES })}
              aria-current={index === currentIndex ? "true" : undefined}
              onClick={() => goTo(index)}
              className={`group flex h-6 w-6 items-center justify-center rounded-sm ${focusRing}`}
            >
              <span
                aria-hidden="true"
                className={`transition-all duration-300 ${
                  index === currentIndex
                    ? "h-0.5 w-5 bg-banquete-rose"
                    : "h-px w-3 bg-banquete-dark/55 group-hover:w-4 group-hover:bg-banquete-dark"
                }`}
              />
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button type="button" aria-label={t("prevLabel")} onClick={prev} className={arrowButton}>
            <ChevronIcon direction="left" size={20} />
          </button>
          <button type="button" aria-label={t("nextLabel")} onClick={next} className={arrowButton}>
            <ChevronIcon direction="right" size={20} />
          </button>
        </div>
      </div>

      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {t("statusLabel", { index: imageNumber, total: TOTAL_IMAGES })}
      </span>
    </section>
  );
}
