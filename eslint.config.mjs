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
    // Site antigo (HTML/CSS/JS puro) e backend Express — fora do escopo do Next.js,
    // não lintados por esta config. Removidos/revisados nas próximas etapas.
    "js/**",
    "css/**",
    "backend/**",
  ]),
]);

export default eslintConfig;
