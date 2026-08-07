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
}: {
  id: ServiceId;
  icon: string;
  index: number;
}) {
  const t = useTranslations("Services");

  return (
    <div className="group flex flex-col overflow-hidden rounded-[10px] border border-banquete-border bg-white text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-banquete-rose-soft-2 hover:shadow-lg">
      <div className="flex aspect-[3/2] w-full items-center justify-center bg-banquete-rose-soft text-sm text-banquete-dark/50">
        {t("imagePlaceholder")}
      </div>
      <div className="flex flex-1 flex-col items-center px-5 py-7">
        <div
          className={`mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-full text-2xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 ${iconBackgrounds[index % 3]}`}
        >
          <span aria-hidden="true">{icon}</span>
        </div>
        <h3 className="mb-2 font-serif text-lg leading-snug text-banquete-dark">
          {t(`items.${id}.title`)}
        </h3>
        <p className="text-sm text-banquete-dark/70">{t("descriptionPlaceholder")}</p>
      </div>
    </div>
  );
}
