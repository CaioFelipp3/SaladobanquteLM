// Filete dourado com um losango no centro — separa título e texto nas seções.
// Puramente decorativo: escondido de leitores de tela.
export default function Ornament({
  align = "center",
  className = "",
}: {
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`flex items-center gap-3 ${align === "center" ? "justify-center" : ""} ${className}`}
    >
      <span className="h-px w-10 bg-banquete-gold" />
      <span className="h-1.5 w-1.5 rotate-45 border border-banquete-gold" />
      <span className="h-px w-10 bg-banquete-gold" />
    </span>
  );
}
