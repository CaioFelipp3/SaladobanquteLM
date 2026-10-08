"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { routing } from "@/lib/i18n/routing";
import LanguageSwitcher from "./LanguageSwitcher";

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
    { href: "/#eventos", label: t("events") },
    { href: "/#galeria", label: t("gallery") },
    { href: "/#contato", label: t("contact") },
  ];

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
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center bg-banquete-bg/97 px-5 py-4 shadow-sm sm:justify-start sm:px-5 sm:py-3.5"
    >
      <button
        ref={toggleRef}
        type="button"
        aria-label={isOpen ? t("closeMenu") : t("openMenu")}
        aria-expanded={isOpen}
        aria-controls="main-nav"
        onClick={() => setIsOpen((open) => !open)}
        className="absolute right-5 top-1/2 flex -translate-y-1/2 flex-col justify-center gap-1.5 rounded-sm p-2 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-banquete-rose sm:hidden"
      >
        <span
          className={`block h-0.5 w-6 rounded bg-banquete-dark transition-transform duration-300 ${
            isOpen ? "translate-y-2 rotate-45" : ""
          }`}
        />
        <span
          className={`block h-0.5 w-6 rounded bg-banquete-dark transition-opacity duration-300 ${
            isOpen ? "opacity-0" : ""
          }`}
        />
        <span
          className={`block h-0.5 w-6 rounded bg-banquete-dark transition-transform duration-300 ${
            isOpen ? "-translate-y-2 -rotate-45" : ""
          }`}
        />
      </button>

      <ul
        id="main-nav"
        className={`${
          isOpen ? "flex" : "hidden"
        } absolute inset-x-0 top-full flex-col items-center gap-5 border-t border-banquete-border bg-banquete-bg/98 py-5 shadow-sm sm:static sm:flex sm:flex-row sm:flex-wrap sm:justify-center sm:gap-7 sm:border-0 sm:bg-transparent sm:py-0 sm:shadow-none`}
      >
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="text-[13px] font-semibold uppercase tracking-wide text-banquete-dark transition-colors hover:text-banquete-rose focus-visible:rounded-sm focus-visible:text-banquete-rose focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-banquete-rose"
            >
              {link.label}
            </Link>
          </li>
        ))}
        <li>
          <LanguageSwitcher
            pathname={pathname}
            locales={routing.locales}
            label={t("languageLabel")}
          />
        </li>
      </ul>
    </nav>
  );
}
