import { useTranslations } from "next-intl";
import type { ServiceId } from "@/lib/data/services";

// Alterna a cor de fundo do ícone entre os três tons da paleta, criando ritmo
// visual — equivalente ao :nth-child(3n+2)/:nth-child(3n+3) do CSS original.
const iconBackgrounds = [
  "bg-banquete-rose-soft",
  "bg-banquete-gold-soft",
  "bg-banquete-rose-soft-2",
] as const;

export default function ServiceCard({
  id,
  icon,
  index,
  onContact,
}: {
  id: ServiceId;
  icon: string;
  index: number;
  onContact: () => void;
}) {
  const t = useTranslations("Services");

  return (
    // relative + o after:inset-0 do botão: o card inteiro vira área de clique
    // sem envolver o <h2> num <button> (HTML inválido, e o leitor de tela
    // leria o card todo como o nome do botão).
    <div className="group relative flex flex-col overflow-hidden rounded-[10px] border border-banquete-border bg-white text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-banquete-rose-soft-2 hover:shadow-lg">
      <div className="flex aspect-[3/2] items-center justify-center bg-banquete-rose-soft text-sm text-banquete-dark/70">
        {t("imagePlaceholder")}
      </div>
      <div className="flex flex-1 flex-col items-center px-5 py-7">
        <div
          className={`mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-full text-2xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 ${iconBackgrounds[index % 3]}`}
        >
          <span aria-hidden="true">{icon}</span>
        </div>
        <h2 className="mb-2 font-serif text-lg leading-snug">
          {t(`items.${id}.title`)}
        </h2>
        <p className="text-sm text-banquete-dark/70">{t("descriptionPlaceholder")}</p>
        <button
          type="button"
          onClick={onContact}
          aria-haspopup="dialog"
          className="mt-auto pt-4 text-xs font-semibold uppercase tracking-wide text-banquete-rose underline-offset-4 after:absolute after:inset-0 group-hover:underline focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-banquete-rose"
        >
          {t("contact.button")}
        </button>
      </div>
    </div>
  );
}
