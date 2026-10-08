import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Link/usePathname já sabem lidar com o prefixo de idioma — usar estes em
// vez dos equivalentes de next/navigation dentro de app/[locale]. O
// createNavigation também oferece redirect/useRouter/getPathname: basta
// adicioná-los aqui quando forem necessários.
export const { Link, usePathname } = createNavigation(routing);
