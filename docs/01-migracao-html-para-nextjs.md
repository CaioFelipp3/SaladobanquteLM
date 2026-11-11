# 01 — Migração de HTML puro para Next.js

> Status: Home, Serviços, Orçamento e Política de Privacidade migrados e funcionando (pt/en), auditados antes da produção (ver [`08-auditoria-seguranca.md`](./08-auditoria-seguranca.md)). O site legado foi removido do repositório. Faltam apenas os conteúdos reais que dependem do negócio (data/descrição do evento "Chá das Flores", descrições e fotos de cada serviço) — o código já está pronto para recebê-los, só os textos estão marcados como placeholder.

## Por que migrar

O site antigo era uma única página (`index.html`) com CSS e JavaScript soltos, sem build step, hospedada direto no Vercel como arquivos estáticos. Isso funciona bem para um site institucional simples, mas trava o crescimento: não dá para ter rotas de verdade (`/servicos`, `/orcamento`), não tem como validar dados de formulário no servidor, e não tem onde plugar autenticação, banco de dados ou pagamento de forma organizada.

O Next.js resolve isso porque é, ao mesmo tempo, um **framework de frontend** (React) e um **ambiente de backend** (rotas de API, Server Components que rodam no servidor). Migrar agora, antes de existir e-commerce e painel admin, evita ter que reescrever tudo depois.

## O que já existia (e o que muda)

| Antes (HTML puro) | Depois (Next.js) | Por quê |
|---|---|---|
| `index.html` com todas as seções na mesma página, navegação por âncora (`#servicos`) | `app/[locale]/page.tsx`, `app/[locale]/servicos/page.tsx`, `app/[locale]/orcamento/page.tsx` — rotas reais | Serviços e Orçamento viram páginas de verdade, com URL própria, em vez de seções da Home |
| `<link href="...Google Fonts...">` no `<head>`, carregado do CDN do Google em runtime | `next/font/google` dentro de `app/[locale]/layout.tsx` | O Next baixa a fonte **no build** e serve pelo próprio domínio — sem esperar o Google Fonts responder, sem layout shift, sem vazar o IP do visitante para o Google a cada carregamento |
| Um `<script src="js/config.js">` (fora do git) com os contatos, carregado no navegador | Constantes em `lib/data/contacts.ts` | Os contatos são públicos (aparecem na página), então não são segredo nem variável de ambiente. Ver [`05-seguranca.md`](./05-seguranca.md) |
| Sem sistema de build; editar o HTML e dar refresh | `npm run dev` (Turbopack) compila, tipa (TypeScript) e recarrega automaticamente | Erros aparecem no terminal/editor antes de chegar no navegador |

## O que foi feito nesta etapa (scaffold)

1. `create-next-app` gerou a base: React 19, Next 16 (App Router), TypeScript, Tailwind v4, ESLint.
2. Estrutura de pastas organizada (ver [`03-estrutura-do-projeto.md`](./03-estrutura-do-projeto.md)).
3. Sistema de internacionalização do zero com `next-intl` (o site antigo não tinha nenhum — ver [`04-i18n.md`](./04-i18n.md)).
4. Tema do Tailwind configurado com a paleta e tipografia do site atual (ver [`02-tailwind-css.md`](./02-tailwind-css.md)).
5. Headers de segurança no `next.config.ts` (ver [`05-seguranca.md`](./05-seguranca.md)).
6. Home, Serviços e Orçamento migradas; depois, na auditoria, Política de Privacidade, 404 traduzida, `robots.txt` e `sitemap.xml`.

## O que aconteceu com o site antigo e o backend

- `index.html`, `css/`, `js/` e `assets/` serviram de referência visual e de conteúdo durante a migração. Com tudo migrado, foram **removidos do repositório** na auditoria (continuam recuperáveis pelo histórico do git e pela branch `main` até o merge).
- `backend/` (Express + Mercado Pago com arquivo JSON) nunca foi publicado. Na auditoria ele foi corrigido, e depois **substituído** pelo checkout de ingressos dentro do próprio Next.js (Route Handler em `app/api/checkout`) e removido do repositório (recuperável pelo histórico do git). Mais tarde, o checkout de ingressos foi removido do site em novembro de 2026, junto com a seção de eventos (recuperável pelo histórico do git, commit anterior a esta remoção).

## Conceito novo: Server Component vs Client Component

No React tradicional (e no site antigo), todo JavaScript roda no navegador. No App Router do Next.js, por padrão, os componentes rodam **no servidor** (Server Components) — só viram JavaScript enviado ao navegador quando marcados explicitamente com `"use client"` no topo do arquivo (necessário para coisas como `onClick`, `useState`, formulários interativos). Isso importa porque menos JavaScript enviado ao navegador = carregamento mais rápido.

Na prática, neste projeto, só usa `"use client"` quem tem estado ou reage a cliques: `Navbar` (menu hamburger), `Gallery` (carrossel), `BudgetForm` e `ClassesSection` (campos dos formulários), `ServicesGrid` e `ServiceContactDialog` (popup de contato), `EbookBuyLink` (registra o clique) e os três componentes de `analytics/` (banner de cookies). Todo o resto — `Hero`, `About`, `Offerings`, `Contact`, `Footer`, `SkipLink`, `WhatsappFloatButton`, as páginas e a 404 — é Server Component, renderizado no servidor sem JavaScript extra no navegador. (`LanguageSwitcher` e as peças de `components/forms/` não têm `"use client"` próprio, mas viram client por serem importados por um componente client.)

## Página de Serviços

Nova página (`app/[locale]/servicos/page.tsx`), sem equivalente direto no site antigo (lá, "Serviços" era só uma seção dentro da Home). Os 9 serviços viraram dados estruturados em `lib/data/services.ts` (só o id) combinados com título/descrição traduzidos em `lib/i18n/messages/*.json` — em vez de repetir HTML para cada card, um único componente `ServiceCard` é reaproveitado com `.map()`. Descrição e imagem de cada serviço estão marcadas como placeholder (`[Descrição a preencher]` / "Imagem em breve"), como combinado — o conteúdo real entra depois sem precisar tocar em código.

**Popup de contato por serviço.** Cada card tem um botão "Solicitar informações", e o card inteiro é clicável, usando a técnica de *link esticado*: um `::after` do botão cobre o card. Envolver o card num `<button>` seria HTML inválido, porque um botão não pode conter um título `<h2>`. O clique abre um popup (`components/services/ServiceContactDialog.tsx`) com duas opções, WhatsApp ou e-mail, e as duas já levam uma mensagem citando o serviço escolhido. O popup é o elemento nativo `<dialog>` do HTML, aberto com `showModal()`: o navegador já cuida de prender o foco dentro dele, fechar com Esc, escurecer o fundo e devolver o foco ao card ao fechar, sem biblioteca extra. Um único popup é compartilhado pelos 9 cards (`ServicesGrid.tsx` guarda qual serviço foi escolhido). Nenhum dado pessoal passa pelo site: as duas opções são links `wa.me`/`mailto:` comuns.

## Página de Orçamento

Também nova. O formulário (`components/budget/BudgetForm.tsx`) não envia dados para nenhum backend nosso: valida tudo no navegador com `zod` (ver `docs/05-seguranca.md`) e, se válido, monta uma mensagem formatada e abre um link `wa.me` (WhatsApp) ou `mailto:` (e-mail) — o próprio WhatsApp/cliente de e-mail do visitante assume a partir daí. Isso foi uma decisão deliberada de segurança e LGPD, não uma limitação: sem backend próprio processando esses dados, não existe onde vazar ou reter informação pessoal indevidamente.

Na auditoria, o formulário perdeu o campo e-mail (era coletado e descartado), ganhou um checkbox obrigatório de ciência da Política de Privacidade e passou a mostrar, junto da mensagem de sucesso, um link manual para o caso de o navegador bloquear a aba do WhatsApp. Ver [`07-protecao-de-dados.md`](./07-protecao-de-dados.md).
