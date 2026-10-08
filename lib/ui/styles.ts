/**
 * Classes Tailwind repetidas em vários componentes. Centralizar aqui evita
 * que um ajuste (ex: contraste, foco) seja feito num lugar e esquecido em
 * outro. O Tailwind v4 escaneia todos os arquivos do projeto, então classes
 * escritas aqui entram no CSS final normalmente.
 */

/** Contorno de foco visível para navegação por teclado (WCAG 2.4.7). */
export const focusRing =
  "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-banquete-rose";

/** Botão/link de ação principal (rosa, texto branco em caixa alta). */
export const buttonPrimary = `inline-block min-h-11 rounded-md bg-banquete-rose px-5 py-3 text-xs font-semibold uppercase text-white transition-colors hover:bg-banquete-rose-dark ${focusRing}`;

/** Título principal (h1) das páginas internas. */
export const pageHeading =
  "mb-5 font-serif text-[30px] leading-tight xs:text-4xl sm:text-5xl";

/** Título (h2) das seções da Home. */
export const sectionHeading =
  "mb-5 font-serif text-[26px] leading-tight xs:text-3xl sm:text-4xl";

/** Parágrafo de texto corrido. */
export const bodyText = "my-4 text-[15px] leading-relaxed xs:text-base";
