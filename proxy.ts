import createMiddleware from "next-intl/middleware";
import { routing } from "./lib/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Roda em todas as rotas, exceto arquivos internos do Next e assets estáticos
  // (evita que o proxy intercepte /favicon.ico, /_next/*, imagens, etc.)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
