import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { notFound } from "next/navigation";
import EbookBuyLink from "@/components/ebooks/EbookBuyLink";
import Ornament from "@/components/ui/Ornament";
import SectionHeader from "@/components/ui/SectionHeader";
import { ebooks } from "@/lib/data/ebooks";
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
  const t = await getTranslations({ locale, namespace: "Ebooks.Metadata" });

  return buildPageMetadata({
    locale,
    path: "/ebooks",
    title: t("title"),
    description: t("description"),
  });
}

export default async function EbooksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (!features.ebooks) notFound();

  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Ebooks");
  const covers = findImages(
    "ebooks",
    ebooks.map((ebook) => ebook.id),
  );

  return (
    <section className={`${container} py-16 sm:py-24`}>
      <SectionHeader as="h1" eyebrow={t("eyebrow")} title={t("heading")} intro={t("intro")} />

      <ul className="mx-auto mt-14 grid max-w-[880px] gap-8 sm:grid-cols-2">
        {ebooks.map(({ id, url }) => {
          const cover = covers[id];
          const title = t(`items.${id}.title`);
          return (
            <li
              key={id}
              className="flex flex-col overflow-hidden rounded-sm border border-banquete-line bg-white"
            >
              {/* Capa em pé, proporção de livro */}
              <div className="relative flex aspect-[3/4] flex-col items-center justify-center gap-3 bg-banquete-rose-soft">
                {cover ? (
                  <Image
                    src={cover}
                    alt={t("coverAlt", { title })}
                    fill
                    sizes="(min-width: 880px) 420px, (min-width: 680px) 50vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <>
                    <Ornament />
                    <span className="font-serif text-base italic text-banquete-dark/70">
                      {t("coverPlaceholder")}
                    </span>
                  </>
                )}
              </div>
              <div className="flex flex-1 flex-col px-6 pb-7 pt-6 text-center sm:px-8">
                <h2 className="font-serif text-2xl leading-snug sm:text-[28px]">{title}</h2>
                {/* Descrição opcional: só aparece quando existir no dicionário */}
                {t.has(`items.${id}.description`) && (
                  <p className="mt-3 text-sm leading-relaxed text-banquete-dark/75">
                    {t(`items.${id}.description`)}
                  </p>
                )}
                <div className="mt-auto pt-6">
                  {url ? (
                    <EbookBuyLink
                      id={id}
                      href={url}
                      label={t("buy")}
                      newTabLabel={t("opensInNewTab")}
                    />
                  ) : (
                    <p className="flex min-h-12 items-center justify-center rounded-sm border border-banquete-line text-[11px] font-semibold uppercase tracking-[0.22em] text-banquete-dark/70">
                      {t("comingSoon")}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mx-auto mt-10 max-w-[560px] text-center text-xs leading-relaxed text-banquete-dark/70">
        {t("purchaseNote")}
      </p>
    </section>
  );
}
