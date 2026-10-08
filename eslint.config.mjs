import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Backend Express (CommonJS, Node puro) — fora do app Next.js e com
    // convenções próprias; não é lintado por esta config.
    "backend/**",
    // js/config.js do site legado pode continuar existindo localmente
    // (ignorado pelo git) — não faz parte do projeto.
    "js/**",
  ]),
]);

export default eslintConfig;
