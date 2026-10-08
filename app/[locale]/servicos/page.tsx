import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ServiceCard from "@/components/services/ServiceCard";
import { buildWhatsappUrl } from "@/lib/data/contacts";
import { services } from "@/lib/data/services";
import { routing } from "@/lib/i18n/routing";
import { bodyText, buttonPrimary, pageHeading } from "@/lib/ui/styles";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Services.Metadata" });
  const path = locale === routing.defaultLocale ? "/servicos" : `/${locale}/servicos`;

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: path,
      languages: { pt: "/servicos", en: "/en/servicos" },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: path,
      siteName: "A Sala do Banquete",
      images: ["/assets/logo.png"],
      locale: locale === "pt" ? "pt_BR" : "en_US",
      type: "website",
    },
  };
}

export default async function ServicosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Services");

  return (
    <section className="mx-auto max-w-[900px] px-5 py-12">
      <h1 className={pageHeading}>{t("heading")}</h1>
      <p className={bodyText}>{t("intro")}</p>

      <div className="mt-8 grid grid-cols-2 gap-3.5 xs:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] xs:gap-5">
        {services.map((service, index) => (
          <ServiceCard key={service.id} id={service.id} icon={service.icon} index={index} />
        ))}
      </div>

      <div className="mt-8 text-center">
        <a
          href={buildWhatsappUrl(t("ctaMessage"))}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonPrimary}
        >
          {t("ctaButton")}
        </a>
      </div>
    </section>
  );
}
