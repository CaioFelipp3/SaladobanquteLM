import { useTranslations } from "next-intl";
import Image from "next/image";
import Ornament from "@/components/ui/Ornament";
import type { ServiceId } from "@/lib/data/services";

export default function ServiceCard({
  id,
  image,
  index,
  onContact,
}: {
  id: ServiceId;
  image?: string;
  index: number;
  onContact: () => void;
}) {
  const t = useTranslations("Services");

  return (
    // relative + o after:inset-0 do botão: o card inteiro vira área de clique
    // sem envolver o <h2> num <button> (HTML inválido, e o leitor de tela
    // leria o card todo como o nome do botão).
    <div className="group relative flex flex-col overflow-hidden rounded-sm border border-banquete-line bg-white text-center transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_24px_48px_-24px_rgba(61,43,53,0.35)]">
      {image ? (
        // alt vazio: a foto ilustra o card e o título logo abaixo já nomeia o
        // serviço — descrevê-la faria o leitor de tela repetir o nome.
        <div className="relative aspect-[3/2] overflow-hidden bg-banquete-rose-soft">
          <Image
            src={image}
            alt=""
            fill
            sizes="(min-width: 1120px) 340px, (min-width: 768px) 33vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="flex aspect-[3/2] flex-col items-center justify-center gap-3 bg-banquete-rose-soft">
          <Ornament />
          <span className="font-serif text-base italic text-banquete-dark/70">
            {t("imagePlaceholder")}
          </span>
        </div>
      )}
      <div className="flex flex-1 flex-col items-center px-4 pb-7 pt-6 xs:px-6">
        {/* Numeração editorial (01, 02...) no lugar dos emojis */}
        <span aria-hidden="true" className="font-serif text-2xl italic text-banquete-gold-text">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h2 className="mt-2 font-serif text-xl leading-snug xs:text-2xl">
          {t(`items.${id}.title`)}
        </h2>
        <p className="mt-2 text-sm text-banquete-dark/70">{t("descriptionPlaceholder")}</p>
        <button
          type="button"
          onClick={onContact}
          aria-haspopup="dialog"
          className="mt-auto pt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-banquete-rose underline-offset-[6px] after:absolute after:inset-0 group-hover:underline focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-banquete-rose"
        >
          {t("contact.button")}
        </button>
      </div>
    </div>
  );
}
