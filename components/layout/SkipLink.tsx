import { useTranslations } from "next-intl";

// Primeiro item focável da página: quem navega por teclado ou leitor de tela
// pula o menu e vai direto ao conteúdo (WCAG 2.4.1). Invisível até receber foco.
export default function SkipLink() {
  const t = useTranslations("Nav");

  return (
    <a
      href="#conteudo"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:bg-banquete-dark focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-white focus:outline focus:outline-[3px] focus:outline-offset-2 focus:outline-banquete-rose"
    >
      {t("skipToContent")}
    </a>
  );
}
