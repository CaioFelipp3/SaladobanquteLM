import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import BudgetForm from "@/components/budget/BudgetForm";
import SectionHeader from "@/components/ui/SectionHeader";
import { buildPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Budget.Metadata" });

  return buildPageMetadata({
    locale,
    path: "/orcamento",
    title: t("title"),
    description: t("description"),
  });
}

export default async function OrcamentoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Budget");

  return (
    <section className="mx-auto max-w-[900px] px-5 py-16 sm:px-8 sm:py-24">
      <SectionHeader as="h1" eyebrow={t("eyebrow")} title={t("heading")} intro={t("intro")} />

      <BudgetForm />
    </section>
  );
}
