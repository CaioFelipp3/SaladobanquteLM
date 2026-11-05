import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { contacts } from "@/lib/data/contacts";
import { buildPageMetadata } from "@/lib/seo/metadata";

// Ordem de exibição das seções — o texto de cada uma fica em
// lib/i18n/messages/*.json, chave Privacy.sections.<id>.
const sectionIds = [
  "controller",
  "collected",
  "flow",
  "payments",
  "purpose",
  "legalBasis",
  "sharing",
  "retention",
  "cookies",
  "security",
  "rights",
  "changes",
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Privacy.Metadata" });

  return buildPageMetadata({
    locale,
    path: "/privacidade",
    title: t("title"),
    description: t("description"),
  });
}

export default async function PrivacidadePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Privacy");

  return (
    <article className="mx-auto max-w-[760px] px-5 py-12 text-[15px] leading-relaxed xs:text-base">
      <h1 className="mb-2 text-center font-serif text-[30px] leading-tight xs:text-4xl sm:text-5xl">
        {t("heading")}
      </h1>
      <p className="mb-6 text-center text-sm text-banquete-dark/70">{t("updatedAt")}</p>
      <p className="my-4">{t("intro")}</p>

      {sectionIds.map((id) => {
        const items = t.has(`sections.${id}.items`)
          ? (t.raw(`sections.${id}.items`) as string[])
          : [];

        return (
          <section key={id} id={id} className="mt-8 scroll-mt-20">
            <h2 className="mb-3 font-serif text-2xl leading-snug">{t(`sections.${id}.title`)}</h2>
            <p className="my-3">{t(`sections.${id}.body`)}</p>
            {items.length > 0 && (
              <ul className="my-3 list-disc space-y-1 pl-6">
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {t.has(`sections.${id}.note`) && <p className="my-3">{t(`sections.${id}.note`)}</p>}
          </section>
        );
      })}

      <p className="mt-10 border-t border-banquete-border pt-6">
        <strong>{t("contactLabel")}</strong>{" "}
        <a
          href={`mailto:${contacts.email}`}
          className="text-banquete-rose underline-offset-2 hover:underline focus-visible:rounded-sm focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-banquete-rose"
        >
          {contacts.email}
        </a>
      </p>
    </article>
  );
}
