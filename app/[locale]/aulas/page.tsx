import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import ClassesSection from "@/components/classes/ClassesSection";
import SectionHeader from "@/components/ui/SectionHeader";
import { classes } from "@/lib/data/classes";
import { findImages } from "@/lib/data/images";
import { features } from "@/lib/features";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { container } from "@/lib/ui/styles";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Classes.Metadata" });

  return buildPageMetadata({
    locale,
    path: "/aulas",
    title: t("title"),
    description: t("description"),
  });
}

export default async function AulasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (!features.classes) notFound();

  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Classes");

  return (
    <section className={`${container} py-16 sm:py-24`}>
      <SectionHeader as="h1" eyebrow={t("eyebrow")} title={t("heading")} intro={t("intro")} />
      <ClassesSection
        images={findImages(
          "aulas",
          classes.map((item) => item.id),
        )}
      />
    </section>
  );
}
