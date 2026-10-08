import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content-Security-Policy — lista branca do que o navegador pode carregar/executar.
 *
 * Por que `'unsafe-inline'` em script-src: todas as páginas são geradas no build
 * (SSG) e o Next.js injeta scripts inline de hidratação nelas. A alternativa
 * segura (nonce) exige renderizar cada página a cada request, perdendo o cache
 * de CDN. Como nenhum dado de usuário é renderizado como HTML (o React escapa
 * tudo e não usamos dangerouslySetInnerHTML), o ganho real do nonce aqui é
 * pequeno. O restante da política continua bloqueando scripts de outros
 * domínios, plugins, <base> injetado e embutir o site em iframe.
 * Ver docs/05-seguranca.md.
 *
 * `'unsafe-eval'` só em desenvolvimento: o React usa eval para reconstruir
 * stacks de erro no navegador; em produção não é necessário.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Sem upgrade-insecure-requests de propósito: em qualquer servidor HTTP sem
  // TLS (npm start local, acesso pelo IP da rede, Safari) ela forçava CSS/JS/
  // fontes a irem por https:// e a página carregava sem estilo nem
  // interatividade. Em produção não acrescenta nada: a Vercel só serve HTTPS
  // (com HSTS) e todos os recursos do site usam URLs relativas.
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // Impede que o site seja carregado dentro de um <iframe> em outro domínio
  // (clickjacking). Redundante com frame-ancestors da CSP, mas cobre
  // navegadores antigos que não entendem CSP nível 2.
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
  // O site não usa nenhum desses recursos do navegador — desliga todos de
  // propósito, reduzindo o que um script malicioso poderia tentar acessar.
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  // Isola a aba de janelas abertas por outros sites (window.opener) — protege
  // contra ataques do tipo tabnabbing e vazamentos entre origens.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Remove o header "X-Powered-By: Next.js" — não revelar a stack a quem
  // procura alvos com CVE conhecida.
  poweredByHeader: false,
  images: {
    // O otimizador de imagens (/_next/image) só aceita arquivos de /images,
    // sem query string — impede usar o endpoint para processar arquivos
    // arbitrários (vetor das CVEs de SSRF/DoS no Image Optimizer).
    localPatterns: [{ pathname: "/images/**", search: "" }],
  },
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
