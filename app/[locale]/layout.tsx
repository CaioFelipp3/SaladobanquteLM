import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import { notFound } from "next/navigation";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import WhatsappFloatButton from "@/components/layout/WhatsappFloatButton";
import { routing } from "@/lib/i18n/routing";
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

const siteUrl = "https://www.saladobanquetelm.com.br";

// generateMetadata roda por locale, então título/descrição/OG saem traduzidos
// e com URL absoluta (obrigatório para Open Graph funcionar em previews de link).
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
    alternates: {
      canonical: locale === routing.defaultLocale ? "/" : `/${locale}`,
      languages: {
        pt: "/",
        en: "/en",
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: locale === routing.defaultLocale ? "/" : `/${locale}`,
      siteName: "A Sala do Banquete",
      images: ["/assets/logo.png"],
      locale: locale === "pt" ? "pt_BR" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/assets/logo.png"],
    },
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
    <html lang={locale} className={`${cormorant.variable} ${montserrat.variable}`}>
      <body className="flex min-h-screen flex-col bg-banquete-bg pt-14 text-banquete-dark antialiased sm:pt-[60px]">
        <NextIntlClientProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsappFloatButton />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
