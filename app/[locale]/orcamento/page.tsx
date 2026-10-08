import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import BudgetForm from "@/components/budget/BudgetForm";
import { routing } from "@/lib/i18n/routing";
import { pageHeading } from "@/lib/ui/styles";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Budget.Metadata" });
  const path = locale === routing.defaultLocale ? "/orcamento" : `/${locale}/orcamento`;

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: path,
      languages: { pt: "/orcamento", en: "/en/orcamento" },
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

export default async function OrcamentoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Budget");

  return (
    <section className="mx-auto max-w-[900px] px-5 py-12">
      <h1 className={`${pageHeading} text-center`}>
        {t("heading")}
      </h1>
      <p className="mx-auto max-w-[560px] text-center text-[15px] leading-relaxed text-banquete-dark xs:text-base">
        {t("intro")}
      </p>

      <BudgetForm />
    </section>
  );
}
