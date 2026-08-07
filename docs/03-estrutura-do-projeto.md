# 03 — Estrutura do projeto

```
Sala do Banquete LM/
├── app/
│   ├── [locale]/                    → tudo que é rota "de verdade" do site vive aqui dentro
│   │   ├── layout.tsx                → layout raiz: <html>, <body>, fontes, Navbar/Footer, provider de i18n
│   │   ├── page.tsx                  → rota "/" (Home)
│   │   ├── servicos/page.tsx         → rota "/servicos"
│   │   └── orcamento/page.tsx        → rota "/orcamento"
│   ├── globals.css                   → import do Tailwind + tema (@theme) + estilos globais
│   └── favicon.ico
├── components/
│   ├── layout/    → Navbar, Footer, LanguageSwitcher, WhatsappFloatButton (usados em toda página)
│   ├── home/      → Hero, About, UpcomingEvents, Gallery, Contact (só usados na Home)
│   ├── services/  → ServiceCard
│   └── budget/    → BudgetForm
├── lib/
│   ├── i18n/
│   │   ├── routing.ts          → define os idiomas suportados (pt, en) e o idioma padrão
│   │   ├── navigation.ts       → Link/useRouter que já sabem lidar com o idioma da URL
│   │   ├── request.ts          → carrega o dicionário de textos certo para cada request
│   │   └── messages/
│   │       ├── pt.json         → todos os textos do site em português
│   │       └── en.json         → todos os textos do site em inglês
│   ├── data/
│   │   ├── contacts.ts         → WhatsApp/Instagram/e-mail/endereço (dados públicos, não são segredo)
│   │   └── services.ts         → lista de serviços (id + ícone; título/descrição vêm do i18n)
│   └── validation/
│       └── budget.ts           → schema zod do formulário de orçamento
├── public/
│   └── assets/                 → imagens servidas via next/image (logo, fotos da galeria, fundadora)
├── docs/                        → esta pasta — documentação de aprendizado
├── proxy.ts                     → roda no servidor antes de cada request; detecta o idioma da URL
├── next.config.ts               → configuração do Next.js: headers de segurança, plugin de i18n
├── tsconfig.json                 → configuração do TypeScript (inclui o atalho de import "@/")
├── package.json                  → dependências e scripts (npm run dev/build/start)
│
├── index.html, css/, js/, assets/   → site antigo, mantido como referência até a migração terminar de vez
└── backend/                      → API de pagamentos (Mercado Pago), intocada nesta fase
```

## Por que `app/[locale]/` e não `app/` direto

O `[locale]` entre colchetes é uma **rota dinâmica** do Next.js — qualquer segmento de URL nessa posição (`pt`, `en`, ou qualquer outra coisa) cai dentro dessa pasta, e o valor fica disponível para o código como `params.locale`. É assim que uma única página serve tanto `/servicos` (português, sem prefixo) quanto `/en/servicos` (inglês) sem duplicar arquivo.

Como `[locale]` é o único conteúdo dentro de `app/`, o `layout.tsx` de dentro dele funciona como o layout raiz do site inteiro (por isso ele é quem define `<html>` e `<body>` — normalmente isso ficaria em um `app/layout.tsx` na raiz, mas aqui não existe esse arquivo porque não é necessário).

## Por que `lib/` separado de `app/`

`app/` é reservado pelo Next.js para **rotas** (cada pasta ali pode virar uma URL). Código que não é rota — configuração, helpers, tipos, dados — fica em `lib/` para não misturar as duas coisas.

- `lib/data/` guarda conteúdo estruturado (contatos, lista de serviços) como constantes TypeScript, em vez de espalhar esses valores direto no JSX de cada componente. Isso evita repetição: o `<select>` do formulário de Orçamento e a grade da página de Serviços leem da mesma lista em `lib/data/services.ts`.
- `lib/validation/` guarda os schemas de validação (`zod`) usados pelos formulários — hoje só o de Orçamento.

## O atalho de import `@/`

Em vez de `import { routing } from "../../../lib/i18n/routing"`, o projeto está configurado (em `tsconfig.json`) para aceitar `import { routing } from "@/lib/i18n/routing"` a partir de qualquer arquivo, não importa o quão fundo ele esteja na árvore de pastas. `@/` sempre aponta para a raiz do projeto.

## `components/`: por que dividido por área, não por tipo

Em vez de uma pasta `components/` plana com dezenas de arquivos, cada subpasta corresponde a "onde aquele componente é usado": `layout/` para o que aparece em toda página (Navbar, Footer), `home/` para o que só existe na Home, `services/` e `budget/` para o que é específico de cada página nova. Quando o projeto crescer (próximas fases: acervo, admin), cada área nova ganha sua própria subpasta em vez de inflar uma pasta única.
