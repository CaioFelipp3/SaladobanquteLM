import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Link/useRouter/usePathname já sabem lidar com o prefixo de idioma —
// usar estes em vez dos equivalentes de next/navigation dentro de app/[locale].
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
