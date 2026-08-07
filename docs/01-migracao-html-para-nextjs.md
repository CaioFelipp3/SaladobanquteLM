# 01 — Migração de HTML puro para Next.js

> Status: Home, Serviços e Orçamento migrados e funcionando (pt/en). Faltam apenas os conteúdos reais que dependem do negócio (data/descrição do evento "Chá das Flores", descrições e fotos de cada serviço) — o código já está pronto para recebê-los, só os textos estão marcados como placeholder.

## Por que migrar

O site antigo era uma única página (`index.html`) com CSS e JavaScript soltos, sem build step, hospedada direto no Vercel como arquivos estáticos. Isso funciona bem para um site institucional simples, mas trava o crescimento: não dá para ter rotas de verdade (`/servicos`, `/orcamento`), não tem como validar dados de formulário no servidor, e não tem onde plugar autenticação, banco de dados ou pagamento de forma organizada.

O Next.js resolve isso porque é, ao mesmo tempo, um **framework de frontend** (React) e um **ambiente de backend** (rotas de API, Server Components que rodam no servidor). Migrar agora, antes de existir e-commerce e painel admin, evita ter que reescrever tudo depois.

## O que já existia (e o que muda)

| Antes (HTML puro) | Depois (Next.js) | Por quê |
|---|---|---|
| `index.html` com todas as seções na mesma página, navegação por âncora (`#servicos`) | `app/[locale]/page.tsx`, `app/[locale]/servicos/page.tsx`, `app/[locale]/orcamento/page.tsx` — rotas reais | Serviços e Orçamento viram páginas de verdade, com URL própria, em vez de seções da Home |
| `<link href="...Google Fonts...">` no `<head>`, carregado do CDN do Google em runtime | `next/font/google` dentro de `app/[locale]/layout.tsx` | O Next baixa a fonte **no build** e serve pelo próprio domínio — sem esperar o Google Fonts responder, sem layout shift, sem vazar o IP do visitante para o Google a cada carregamento |
| Um `<script src="js/config.js">` com dados sensíveis, carregado no navegador | Variáveis de ambiente (`.env.local`) lidas só no servidor, quando necessário | Ver [`05-seguranca.md`](./05-seguranca.md) |
| Sem sistema de build; editar o HTML e dar refresh | `npm run dev` (Turbopack) compila, tipa (TypeScript) e recarrega automaticamente | Erros aparecem no terminal/editor antes de chegar no navegador |

## O que foi feito nesta etapa (scaffold)

1. `create-next-app` gerou a base: React 19, Next 16 (App Router), TypeScript, Tailwind v4, ESLint.
2. Estrutura de pastas organizada (ver [`03-estrutura-do-projeto.md`](./03-estrutura-do-projeto.md)).
3. Sistema de internacionalização do zero com `next-intl` (o site antigo não tinha nenhum — ver [`04-i18n.md`](./04-i18n.md)).
4. Tema do Tailwind configurado com a paleta e tipografia do site atual (ver [`02-tailwind-css.md`](./02-tailwind-css.md)).
5. Headers de segurança no `next.config.ts` (ver [`05-seguranca.md`](./05-seguranca.md)).
6. Uma página inicial de teste (`app/[locale]/page.tsx`) só para provar que a base funciona em português e em inglês — **ainda não é a Home de verdade**.

## O que NÃO mudou (de propósito)

- `index.html`, `css/`, `js/`, `assets/` continuam no repositório, intactos. São a referência visual e de conteúdo até cada pedaço ser migrado — só serão removidos quando não sobrar mais nada dependendo deles.
- `backend/` (Express + Mercado Pago) não foi tocado. Fica fora da árvore do Next por enquanto; decidimos o que fazer com ele quando chegarmos na fase de e-commerce.

## Conceito novo: Server Component vs Client Component

No React tradicional (e no site antigo), todo JavaScript roda no navegador. No App Router do Next.js, por padrão, os componentes rodam **no servidor** (Server Components) — só viram JavaScript enviado ao navegador quando marcados explicitamente com `"use client"` no topo do arquivo (necessário para coisas como `onClick`, `useState`, formulários interativos). Isso importa porque menos JavaScript enviado ao navegador = carregamento mais rápido.

Na prática, neste projeto, só três componentes precisaram de `"use client"`: `Navbar` (estado do menu hamburger), `Gallery` (estado do carrossel) e `BudgetForm` (estado dos campos do formulário). Todo o resto — `Hero`, `About`, `UpcomingEvents`, `Contact`, `Footer`, `WhatsappFloatButton`, as páginas de Serviços e a própria página de Orçamento — é Server Component, renderizado no servidor sem JavaScript extra no navegador.

## Página de Serviços

Nova página (`app/[locale]/servicos/page.tsx`), sem equivalente direto no site antigo (lá, "Serviços" era só uma seção dentro da Home). Os 9 serviços viraram dados estruturados em `lib/data/services.ts` (id + ícone) combinados com título/descrição traduzidos em `lib/i18n/messages/*.json` — em vez de repetir HTML para cada card, um único componente `ServiceCard` é reaproveitado com `.map()`. Descrição e imagem de cada serviço estão marcadas como placeholder (`[Descrição a preencher]` / "Imagem em breve"), como combinado — o conteúdo real entra depois sem precisar tocar em código.

## Página de Orçamento

Também nova. O formulário (`components/budget/BudgetForm.tsx`) não envia dados para nenhum backend nosso: valida tudo no navegador com `zod` (ver `docs/05-seguranca.md`) e, se válido, monta uma mensagem formatada e abre um link `wa.me` (WhatsApp) ou `mailto:` (e-mail) — o próprio WhatsApp/cliente de e-mail do visitante assume a partir daí. Isso foi uma decisão deliberada de segurança e LGPD, não uma limitação: sem backend próprio processando esses dados, não existe onde vazar ou reter informação pessoal indevidamente.
