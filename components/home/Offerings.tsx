import { useTranslations } from "next-intl";
import Image from "next/image";
import SectionHeader from "@/components/ui/SectionHeader";
import { features } from "@/lib/features";
import { Link } from "@/lib/i18n/navigation";
import { buttonOutline, container, eyebrow, eyebrowType, sectionSpacing } from "@/lib/ui/styles";

// Fotos de ambientação dos dois cards. Trocar aqui quando houver fotos
// próprias das aulas e dos e-books.
const offerings = [
  { key: "classes", href: "/aulas", image: "/images/servicos/etiqueta-mesa.jpg", enabled: features.classes },
  { key: "ebooks", href: "/ebooks", image: "/images/galeria/5.jpeg", enabled: features.ebooks },
] as const;

// Resumo de Aulas de Etiqueta e E-books na Home. Seção fora do ar
// (lib/features.ts) aparece como "Em breve", sem link — a página dela
// responde 404 até ser ligada.
export default function Offerings() {
  const t = useTranslations("Home.Offerings");

  return (
    <section id="aulas-e-ebooks" className={`bg-white ${sectionSpacing}`}>
      <div className={container}>
        <SectionHeader eyebrow={t("eyebrow")} title={t("heading")} intro={t("intro")} />

        <ul className="mx-auto mt-14 grid max-w-[1000px] gap-8 md:grid-cols-2">
          {offerings.map(({ key, href, image, enabled }) => (
            <li
              key={key}
              className="group flex flex-col overflow-hidden rounded-sm border border-banquete-line bg-banquete-bg"
            >
              <div className="relative aspect-[3/2] overflow-hidden">
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="(min-width: 1000px) 480px, (min-width: 768px) 50vw, 100vw"
                  className={`object-cover transition-transform duration-700 ${enabled ? "group-hover:scale-105" : ""}`}
                />
                {!enabled && (
                  // Selo decorativo: o "Em breve" do rodapé do card é o texto lido
                  <span
                    aria-hidden="true"
                    className={`${eyebrowType} absolute left-5 top-5 rounded-sm bg-banquete-dark/85 px-3 py-2 text-banquete-gold`}
                  >
                    {t("comingSoon")}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col items-center px-6 pb-9 pt-8 text-center sm:px-10">
                <p className={eyebrow}>{t(`${key}.eyebrow`)}</p>
                <h3 className="mt-4 font-serif text-3xl font-light leading-tight sm:text-4xl">
                  {t(`${key}.title`)}
                </h3>
                <p className="mb-8 mt-4 text-[15px] leading-[1.8] text-banquete-dark/80">
                  {t(`${key}.body`)}
                </p>
                {enabled ? (
                  <Link href={href} className={`${buttonOutline} mt-auto`}>
                    {t(`${key}.cta`)}
                  </Link>
                ) : (
                  <p className="mt-auto flex min-h-12 items-center justify-center rounded-sm border border-banquete-line px-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-banquete-dark/70">
                    {t("comingSoon")}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
