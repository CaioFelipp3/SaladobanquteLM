# 06 — Glossário

Termos técnicos usados neste projeto, explicados de forma simples. Ordem alfabética; cresce a cada etapa.

**App Router** — o sistema de rotas do Next.js baseado em pastas dentro de `app/`. Cada pasta com um `page.tsx` vira uma URL. Substituiu o sistema antigo do Next.js ("Pages Router"), que usava `pages/`.

**Client Component** — um componente React que roda (também) no navegador do visitante, marcado com `"use client"` no topo do arquivo. Necessário para qualquer coisa interativa: `onClick`, `useState`, formulários. Contraste com **Server Component**.

**CSS utility-first** — abordagem do Tailwind: classes pequenas de propósito único (`bg-red-500`, `p-4`) compostas diretamente no HTML/JSX, em vez de escrever regras CSS nomeadas à parte. Ver [`02-tailwind-css.md`](./02-tailwind-css.md).

**Framework** — um conjunto de ferramentas e convenções que decide "a forma certa" de estruturar um projeto, em troca de dar bastante coisa pronta (roteamento, otimizações, build). Next.js é um framework construído em cima do React.

**LGPD** — Lei Geral de Proteção de Dados (Brasil). Entre outras coisas, exige minimizar quais dados pessoais você coleta e por quanto tempo guarda. Influencia diretamente a decisão do formulário de Orçamento (ver [`05-seguranca.md`](./05-seguranca.md)).

**Locale** — identificador de idioma/região, ex: `pt`, `en`. É o que decide qual arquivo de tradução (`lib/i18n/messages/pt.json` ou `en.json`) é usado.

**next-intl** — biblioteca usada para internacionalização (i18n) do site. Ver [`04-i18n.md`](./04-i18n.md).

**next/font** — sistema do Next.js para carregar fontes (do Google Fonts ou locais) de forma otimizada: baixa a fonte durante o build e serve pelo próprio domínio, em vez do navegador buscar direto no Google a cada visita.

**npm / package.json** — `npm` é o gerenciador de pacotes do Node.js (instala bibliotecas de terceiros). `package.json` é o arquivo que lista quais bibliotecas o projeto usa (`dependencies`) e os comandos disponíveis (`scripts`, ex: `npm run dev`).

**Proxy (`proxy.ts`)** — arquivo especial do Next.js que roda no servidor antes de qualquer página, podendo inspecionar/redirecionar a requisição. Neste projeto, decide qual idioma aplicar com base na URL. Chamava-se `middleware.ts` até a versão 15 do Next.js.

**Rota dinâmica** — uma pasta entre colchetes dentro de `app/`, como `[locale]`, que aceita qualquer valor naquele segmento da URL. O valor fica disponível no código.

**Server Component** — um componente React que roda **só no servidor**; o navegador recebe apenas o HTML já pronto, sem o código JavaScript daquele componente. É o padrão no App Router do Next.js (todo componente é Server Component a menos que marcado como Client Component). Reduz a quantidade de JavaScript enviada ao navegador.

**SSG (Static Site Generation)** — gerar o HTML de uma página **durante o build**, não a cada requisição. Mais rápido para o visitante, porque o servidor só entrega um arquivo pronto. Usamos isso para as páginas de idioma (`generateStaticParams`).

**Tailwind CSS** — biblioteca de CSS utility-first usada para estilizar o site. Ver [`02-tailwind-css.md`](./02-tailwind-css.md).

**TypeScript** — JavaScript com um sistema de tipos por cima. Permite que o editor e o compilador avisem sobre erros (ex: passar um número onde se esperava texto) antes do código rodar, em vez de descobrir o bug em produção.

**Turbopack** — o compilador usado pelo `next dev`/`next build` neste projeto (sucessor do Webpack dentro do ecossistema Next.js). Mais rápido para recompilar durante o desenvolvimento.

**zod** — biblioteca de validação de schemas usada no formulário de Orçamento (`lib/validation/budget.ts`). Descreve "a forma que os dados devem ter" (tipo, tamanho mínimo/máximo, formato) e, dado um valor qualquer, diz se ele é válido e, se não for, por quê.

**XSS (Cross-Site Scripting)** — vulnerabilidade em que um atacante consegue injetar código JavaScript malicioso numa página (por exemplo, via um campo de formulário mal validado que depois é exibido sem tratamento). Uma das razões pelas quais o formulário de Orçamento vai validar e sanitizar todos os campos antes de qualquer uso.

**Clickjacking** — técnica de enganar o usuário a clicar em algo diferente do que ele acha que está clicando, geralmente sobrepondo o site alvo dentro de um `<iframe>` invisível. Prevenido pelo header `X-Frame-Options` (ver [`05-seguranca.md`](./05-seguranca.md)).
