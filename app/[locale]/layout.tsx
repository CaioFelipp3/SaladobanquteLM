import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import { notFound } from "next/navigation";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import SkipLink from "@/components/layout/SkipLink";
import WhatsappFloatButton from "@/components/layout/WhatsappFloatButton";
import { routing } from "@/lib/i18n/routing";
import { siteName, siteUrl } from "@/lib/seo/metadata";
import "../globals.css";

// next/font baixa e otimiza as fontes no build (self-hosted, sem chamada externa
// ao Google Fonts em runtime) — troca direta pelas duas fontes que o site já usava.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-montserrat",
  display: "swap",
});

// Base para todas as páginas, inclusive a 404. Canonical, alternates e
// Open Graph completos ficam em cada page.tsx (lib/seo/metadata.ts) — se
// ficassem aqui, a 404 herdaria o canonical da Home.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    metadataBase: new URL(siteUrl),
    title: t("title"),
    description: t("description"),
    openGraph: { siteName },
  };
}

// Gera as variações de locale ("pt", "en") no build (SSG) em vez de descobrir
// o locale só em runtime. Com localePrefix "as-needed", "pt" é servido em "/"
// (sem prefixo) e "en" em "/en" — os nomes aqui são o parâmetro interno da
// rota, não necessariamente o prefixo visível na URL.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Avisa o Next.js que este locale (vindo de generateStaticParams) pode ser
  // resolvido em build time — sem isso, qualquer useTranslations() descendente
  // força a rota inteira para renderização dinâmica a cada request, mesmo
  // com generateStaticParams configurado. Ver docs/04-i18n.md.
  setRequestLocale(locale);

  return (
    // scroll-pt-20: o menu é fixo no topo (≈60px). Sem essa folga, links de
    // âncora (#sobre) e o foco no primeiro campo inválido do formulário
    // paravam escondidos atrás dele (WCAG 2.4.11 — foco não obscurecido).
    <html
      lang={locale === "pt" ? "pt-BR" : locale}
      className={`${cormorant.variable} ${montserrat.variable} scroll-pt-20`}
    >
      <body className="flex min-h-screen flex-col bg-banquete-bg pt-14 text-banquete-dark antialiased sm:pt-[60px]">
        <NextIntlClientProvider>
          <SkipLink />
          <Navbar />
          {/* tabIndex -1: permite que o "pular para o conteúdo" mova o foco
              para cá sem tornar o <main> parte da ordem de Tab. */}
          <main id="conteudo" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
          <Footer />
          <WhatsappFloatButton />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
