# 03 — Estrutura do projeto

```
Sala do Banquete LM/
├── app/
│   ├── [locale]/                    → tudo que é rota "de verdade" do site vive aqui dentro
│   │   ├── layout.tsx                → layout raiz: <html>, <body>, fontes, Navbar/Footer, provider de i18n
│   │   ├── page.tsx                  → rota "/" (Home)
│   │   ├── servicos/page.tsx         → rota "/servicos"
│   │   ├── aulas/page.tsx            → rota "/aulas" (aulas de etiqueta + formulário de interesse)
│   │   ├── ebooks/page.tsx           → rota "/ebooks" (link de compra na plataforma externa)
│   │   ├── orcamento/page.tsx        → rota "/orcamento"
│   │   ├── privacidade/page.tsx      → rota "/privacidade" (Política de Privacidade)
│   │   ├── not-found.tsx             → página 404 traduzida, dentro do layout
│   │   └── [...rest]/page.tsx        → pega qualquer caminho inexistente e dispara a 404 acima
│   ├── robots.ts                     → gera /robots.txt
│   ├── sitemap.ts                    → gera /sitemap.xml (todas as páginas × idiomas)
│   ├── globals.css                   → import do Tailwind + tema (@theme) + estilos globais
│   ├── favicon.ico                   → ícone da aba (monograma "Lm", 32px)
│   ├── icon.png                      → ícone 512px (buscadores, favoritos)
│   └── apple-icon.png                → ícone da tela inicial do iPhone (180px)
├── components/
│   ├── layout/    → Navbar, Footer, LanguageSwitcher, SkipLink, WhatsappFloatButton (usados em toda página)
│   ├── home/      → Hero, About, Offerings (resumo de Aulas e E-books), Gallery, Contact (só usados na Home)
│   ├── services/  → ServicesGrid (grade + estado), ServiceCard, ServiceContactDialog (popup WhatsApp/e-mail)
│   ├── budget/    → BudgetForm
│   ├── classes/   → ClassesSection (cards das aulas + formulário de interesse)
│   ├── ebooks/    → EbookBuyLink (link de compra que registra o clique no GA)
│   ├── forms/     → peças comuns aos dois formulários (orçamento e aulas):
│   │                 FormParts (estilos, erro de campo, checkbox da política, botões de envio,
│   │                 mensagem de sucesso/erro) e useContactForm (estado, validação e envio)
│   ├── analytics/ → CookieBanner, CookiePreferencesButton, GoogleAnalytics
│   ├── seo/       → JsonLd (dados estruturados para o Google)
│   ├── ui/        → SectionHeader (rótulo + título + ornamento), Ornament
│   └── icons/     → WhatsappIcon e LineIcons (ícones de traço fino)
├── lib/
│   ├── i18n/
│   │   ├── routing.ts          → define os idiomas suportados (pt, en) e o idioma padrão
│   │   ├── navigation.ts       → Link/usePathname que já sabem lidar com o idioma da URL
│   │   ├── request.ts          → carrega o dicionário de textos certo para cada request
│   │   └── messages/
│   │       ├── pt.json         → todos os textos do site em português
│   │       └── en.json         → todos os textos do site em inglês
│   ├── data/
│   │   ├── contacts.ts         → WhatsApp/Instagram/e-mail/endereço (dados públicos, não são segredo)
│   │   ├── services.ts         → lista de serviços (só o id; título/descrição vêm do i18n)
│   │   ├── classes.ts          → lista de aulas de etiqueta (só o id)
│   │   ├── ebooks.ts           → lista de e-books (id + link de compra; vazio = "Em breve")
│   │   └── images.ts           → findImages(): acha a foto <id>.jpg de cada item em public/images/<pasta>/
│   ├── analytics/
│   │   ├── config.ts           → lê e valida o ID do Google Analytics (variável de ambiente)
│   │   ├── consent.ts          → guarda a escolha do banner de cookies
│   │   └── gtag.ts             → carrega/desliga o Google Analytics e envia eventos
│   ├── seo/
│   │   ├── metadata.ts         → domínio canônico, lista de páginas e buildPageMetadata()
│   │   └── structuredData.ts   → dados estruturados (schema.org) da Home
│   ├── features.ts             → liga/desliga as seções de Aulas e E-books
│   ├── ui/
│   │   └── styles.ts           → classes Tailwind compartilhadas (botão, títulos, foco)
│   └── validation/
│       ├── common.ts           → regras comuns: nome, telefone, mensagem, ciência da política
│       ├── budget.ts           → schema zod do formulário de orçamento
│       └── classInterest.ts    → schema zod do formulário de interesse em aulas
├── public/
│   └── images/
│       ├── galeria/            → fotos da galeria: 1.jpeg, 2.jpeg … (quantidade em Gallery.tsx)
│       ├── servicos/           → <id-do-serviço>.jpg (ex: casamento.jpg) — aparece sozinha no card
│       ├── aulas/              → <id-da-aula>.jpg (ex: aula-1.jpg) — idem
│       ├── ebooks/             → capa <id-do-ebook>.jpg (ex: ebook-1.jpg), em pé (3:4) — idem
│       ├── marca/              → logo.png e compartilhamento.jpg (1200×630, preview de links)
│       └── equipe/             → liliam.jpg (foto da seção Sobre)
├── docs/                        → esta pasta — documentação de aprendizado
├── proxy.ts                     → roda no servidor antes de cada request; detecta o idioma da URL
├── next.config.ts               → configuração do Next.js: CSP e headers de segurança, imagens, plugin de i18n
├── tsconfig.json                 → configuração do TypeScript (inclui o atalho de import "@/")
├── package.json                  → dependências e scripts (npm run dev/build/start/lint/scan:secrets)
├── .env.example                  → variáveis de ambiente (ID do Google Analytics), sem valores
├── .gitleaks.toml                → regras do detector de segredos (ver seguranca-informacoes.md)
├── .husky/pre-commit             → roda gitleaks + lint antes de cada commit
├── .husky/install.mjs            → ativa os hooks no npm install (pula em CI/Vercel)
├── .github/dependabot.yml        → PRs semanais de atualização de dependências
├── .gitattributes                → LF em todo texto, imagens como binário
└── .gitignore                    → .env*, chaves, dumps, planilhas, build, arquivos do sistema
```

## Por que `app/[locale]/` e não `app/` direto

O `[locale]` entre colchetes é uma **rota dinâmica** do Next.js — qualquer segmento de URL nessa posição (`pt`, `en`, ou qualquer outra coisa) cai dentro dessa pasta, e o valor fica disponível para o código como `params.locale`. É assim que uma única página serve tanto `/servicos` (português, sem prefixo) quanto `/en/servicos` (inglês) sem duplicar arquivo.

Como `[locale]` é o único conteúdo dentro de `app/`, o `layout.tsx` de dentro dele funciona como o layout raiz do site inteiro (por isso ele é quem define `<html>` e `<body>` — normalmente isso ficaria em um `app/layout.tsx` na raiz, mas aqui não existe esse arquivo porque não é necessário).

## Por que `lib/` separado de `app/`

`app/` é reservado pelo Next.js para **rotas** (cada pasta ali pode virar uma URL). Código que não é rota — configuração, helpers, tipos, dados — fica em `lib/` para não misturar as duas coisas.

- `lib/data/` guarda conteúdo estruturado (contatos, lista de serviços) como constantes TypeScript, em vez de espalhar esses valores direto no JSX de cada componente. Isso evita repetição: o `<select>` do formulário de Orçamento e a grade da página de Serviços leem da mesma lista em `lib/data/services.ts`.
- `lib/validation/` guarda os schemas de validação (`zod`) usados pelos formulários — hoje só o de Orçamento.
- `lib/seo/` centraliza o que toda página precisa para SEO (canonical, idiomas alternativos, Open Graph). Antes, esse bloco era copiado em cada `page.tsx`, e uma cópia esquecida fazia as tags do Twitter mostrarem o título da Home em outra página.
- `lib/ui/` guarda as combinações de classes Tailwind que se repetem (ver [`02-tailwind-css.md`](./02-tailwind-css.md)).

**Critério para criar uma pasta nova em `lib/`:** é código sem JSX, usado por mais de um lugar, com um assunto claro (dados, i18n, SEO, validação). Se só um componente usa, fica no próprio componente.

## O atalho de import `@/`

Em vez de `import { routing } from "../../../lib/i18n/routing"`, o projeto está configurado (em `tsconfig.json`) para aceitar `import { routing } from "@/lib/i18n/routing"` a partir de qualquer arquivo, não importa o quão fundo ele esteja na árvore de pastas. `@/` sempre aponta para a raiz do projeto.

## `components/`: por que dividido por área, não por tipo

Em vez de uma pasta `components/` plana com dezenas de arquivos, cada subpasta corresponde a "onde aquele componente é usado": `layout/` para o que aparece em toda página (Navbar, Footer), `home/` para o que só existe na Home, `services/` e `budget/` para o que é específico de cada página nova, e `icons/` para ícones SVG usados em mais de um lugar. Quando o projeto crescer (próximas fases: acervo, admin), cada área nova ganha sua própria subpasta em vez de inflar uma pasta única.
