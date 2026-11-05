import Ornament from "@/components/ui/Ornament";
import { eyebrow as eyebrowClasses, pageTitle, sectionHeading } from "@/lib/ui/styles";

// Rótulo + título + ornamento + introdução, no mesmo ritmo em todas as
// seções. `as="h1"` nas páginas internas, onde o título é o da página.
export default function SectionHeader({
  eyebrow,
  title,
  intro,
  as: Heading = "h2",
  align = "center",
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  as?: "h1" | "h2";
  align?: "center" | "left";
}) {
  const centered = align === "center";

  return (
    <header className={centered ? "mx-auto max-w-[640px] text-center" : ""}>
      <p className={`${eyebrowClasses} mb-5`}>{eyebrow}</p>
      <Heading className={Heading === "h1" ? pageTitle : sectionHeading}>
        {title}
      </Heading>
      <Ornament align={align} className="mt-6" />
      {intro && (
        <p className="mt-6 text-[15px] leading-[1.8] text-banquete-dark/75 xs:text-base">{intro}</p>
      )}
    </header>
  );
}
