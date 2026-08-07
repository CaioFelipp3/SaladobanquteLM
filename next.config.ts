import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const securityHeaders = [
  // Impede que o site seja carregado dentro de um <iframe> em outro domínio (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Impede que o navegador tente "adivinhar" o tipo de um arquivo (MIME sniffing)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limita quanta informação da URL de origem vaza para outros sites via header Referer
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Força HTTPS por 2 anos, inclusive em subdomínios. A Vercel já adiciona isso
  // automaticamente em produção, mas deixamos explícito aqui para não depender
  // só do comportamento implícito da plataforma (portabilidade/defesa em profundidade).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // O site não usa câmera, microfone nem geolocalização — desliga essas
  // permissões de propósito, reduzindo o que um script malicioso poderia
  // tentar acessar caso algum dia entre um script de terceiro comprometido.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

export default withNextIntl(nextConfig);
