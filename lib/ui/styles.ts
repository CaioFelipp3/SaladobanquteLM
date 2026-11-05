/**
 * Classes Tailwind repetidas em vários componentes. Centralizar aqui evita
 * que um ajuste (ex: contraste, foco) seja feito num lugar e esquecido em
 * outro. O Tailwind v4 escaneia todos os arquivos do projeto, então classes
 * escritas aqui entram no CSS final normalmente.
 */

/** Contorno de foco visível para navegação por teclado (WCAG 2.4.7). */
export const focusRing =
  "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-banquete-rose";

/** Largura e respiro lateral padrão do conteúdo das seções. */
export const container = "mx-auto w-full max-w-[1120px] px-5 sm:px-8";

/** Respiro vertical padrão entre seções. */
export const sectionSpacing = "py-20 sm:py-28";

/** Contorno de foco para elementos sobre fundo escuro (hero, rodapé). */
export const focusRingLight =
  "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-white";

/** Formato dos botões, sem cor nem foco — para compor variantes. */
export const buttonShape =
  "inline-flex min-h-12 items-center justify-center rounded-sm px-8 py-3.5 text-center text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors duration-300";

/** Botão/link de ação principal (rosa, texto branco em caixa alta espaçada). */
export const buttonPrimary = `${buttonShape} bg-banquete-rose text-white hover:bg-banquete-dark ${focusRing}`;

/** Ação secundária: só contorno, preenche no hover. */
export const buttonOutline = `${buttonShape} border border-banquete-dark text-banquete-dark hover:bg-banquete-dark hover:text-white ${focusRing}`;

/** Tipografia do rótulo pequeno acima dos títulos, sem cor (fundos escuros). */
export const eyebrowType = "block text-[11px] font-semibold uppercase tracking-[0.32em]";

/** Rótulo pequeno acima dos títulos ("Nossa história", "Agenda"...). */
export const eyebrow = `${eyebrowType} text-banquete-gold-text`;

/** Tipografia do título principal (h1) das páginas internas. */
export const pageTitle = "font-serif text-[36px] font-light leading-[1.08] xs:text-[42px] sm:text-6xl";

/** Título principal (h1) das páginas internas — centralizado. */
export const pageHeading = `mb-5 text-center ${pageTitle}`;

/** Título (h2) das seções da Home. */
export const sectionHeading =
  "font-serif text-[34px] font-light leading-[1.1] xs:text-[40px] sm:text-5xl";

/** Parágrafo de texto corrido. */
export const bodyText = "my-4 text-[15px] leading-[1.85] text-banquete-dark/85 xs:text-base";
