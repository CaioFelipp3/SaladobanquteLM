import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ServicesGrid from "@/components/services/ServicesGrid";
import SectionHeader from "@/components/ui/SectionHeader";
import { buildWhatsappUrl } from "@/lib/data/contacts";
import { findServiceImages } from "@/lib/data/serviceImages";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buttonPrimary, container } from "@/lib/ui/styles";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Services.Metadata" });

  return buildPageMetadata({
    locale,
    path: "/servicos",
    title: t("title"),
    description: t("description"),
  });
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
    <section className={`${container} py-16 sm:py-24`}>
      <SectionHeader as="h1" eyebrow={t("eyebrow")} title={t("heading")} intro={t("intro")} />

      <ServicesGrid images={findServiceImages()} />

      <div className="mt-14 text-center">
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
