"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRef, useState } from "react";
import { features } from "@/lib/features";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { routing } from "@/lib/i18n/routing";
import { focusRing } from "@/lib/ui/styles";
import LanguageSwitcher from "./LanguageSwitcher";

// Sublinhado dourado que cresce da esquerda no hover (só no menu horizontal).
const linkClasses = `relative text-[13px] font-semibold uppercase tracking-[0.18em] transition-colors hover:text-banquete-rose focus-visible:rounded-sm focus-visible:text-banquete-rose focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-banquete-rose lg:text-[11px] lg:after:absolute lg:after:-bottom-1.5 lg:after:left-0 lg:after:h-px lg:after:w-full lg:after:origin-left lg:after:scale-x-0 lg:after:bg-banquete-gold lg:after:transition-transform lg:after:duration-300 lg:hover:after:scale-x-100`;

// Precisa ser Client Component: o menu hamburger do mobile depende de estado
// (aberto/fechado), o que só existe em componentes que rodam no navegador.
export default function Navbar() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const links = [
    { href: "/", label: t("home") },
    { href: "/#sobre", label: t("about") },
    { href: "/servicos", label: t("services") },
    { href: "/aulas", label: t("classes"), enabled: features.classes },
    { href: "/ebooks", label: t("ebooks"), enabled: features.ebooks },
    { href: "/#galeria", label: t("gallery") },
    { href: "/#contato", label: t("contact") },
  ].filter((link) => link.enabled !== false);

  return (
    <nav
      aria-label={t("ariaLabel")}
      // Esc fecha o menu mobile e devolve o foco ao botão (padrão de disclosure)
      onKeyDown={(event) => {
        if (event.key === "Escape" && isOpen) {
          setIsOpen(false);
          toggleRef.current?.focus();
        }
      }}
      className="fixed inset-x-0 top-0 z-50 border-b border-banquete-line/70 bg-banquete-bg/90 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          onClick={() => setIsOpen(false)}
          className={`shrink-0 rounded-sm ${focusRing}`}
        >
          <Image
            src="/images/marca/logo.png"
            alt={t("logoAlt")}
            width={96}
            height={45}
            loading="eager"
            className="h-[45px] w-auto"
          />
        </Link>

        <button
          ref={toggleRef}
          type="button"
          aria-label={isOpen ? t("closeMenu") : t("openMenu")}
          aria-expanded={isOpen}
          aria-controls="main-nav"
          onClick={() => setIsOpen((open) => !open)}
          className={`flex flex-col justify-center gap-1.5 rounded-sm p-2 lg:hidden ${focusRing}`}
        >
          <span
            className={`h-px w-6 bg-banquete-dark transition-transform duration-300 ${
              isOpen ? "translate-y-[7px] rotate-45" : ""
            }`}
          />
          <span
            className={`h-px w-6 bg-banquete-dark transition-opacity duration-300 ${
              isOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`h-px w-6 bg-banquete-dark transition-transform duration-300 ${
              isOpen ? "-translate-y-[7px] -rotate-45" : ""
            }`}
          />
        </button>

        <ul
          id="main-nav"
          className={`${
            isOpen ? "flex" : "hidden"
          } absolute inset-x-0 top-full flex-col items-center gap-6 border-b border-banquete-line bg-banquete-bg py-8 shadow-[0_12px_24px_-12px_rgba(61,43,53,0.18)] lg:static lg:flex lg:flex-row lg:gap-8 lg:border-0 lg:bg-transparent lg:py-0 lg:shadow-none`}
        >
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} onClick={() => setIsOpen(false)} className={linkClasses}>
                {link.label}
              </Link>
            </li>
          ))}
          <li className="lg:border-l lg:border-banquete-line lg:pl-8">
            <LanguageSwitcher
              pathname={pathname}
              locales={routing.locales}
              label={t("languageLabel")}
            />
          </li>
          {/* Entre lg e xl não há largura para o botão ao lado dos links. */}
          <li className="lg:hidden xl:block">
            <Link
              href="/orcamento"
              onClick={() => setIsOpen(false)}
              className={`inline-flex min-h-11 items-center rounded-sm border border-banquete-rose px-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-banquete-rose transition-colors duration-300 hover:bg-banquete-rose hover:text-white ${focusRing}`}
            >
              {t("quote")}
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
