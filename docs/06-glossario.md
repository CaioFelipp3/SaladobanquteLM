# 06 — Glossário

Termos técnicos usados neste projeto, explicados de forma simples. Ordem alfabética; cresce a cada etapa.

**App Router** — o sistema de rotas do Next.js baseado em pastas dentro de `app/`. Cada pasta com um `page.tsx` vira uma URL. Substituiu o sistema antigo do Next.js ("Pages Router"), que usava `pages/`.

**axe-core** — motor de auditoria automática de acessibilidade (o mesmo usado pelo Lighthouse do Chrome). Roda dentro da página e aponta violações da WCAG, como contraste insuficiente ou botão sem nome acessível. Ver [`08-auditoria-seguranca.md`](./08-auditoria-seguranca.md).

**Base legal (LGPD)** — o motivo, previsto no art. 7º da LGPD, que autoriza tratar um dado pessoal. Consentimento é só uma das dez bases; o orçamento usa a do inciso V (procedimentos preliminares a contrato, a pedido do titular). Ver [`07-protecao-de-dados.md`](./07-protecao-de-dados.md).

**Clickjacking** — técnica de enganar o usuário a clicar em algo diferente do que ele acha que está clicando, geralmente sobrepondo o site alvo dentro de um `<iframe>` invisível. Prevenido pelo header `X-Frame-Options` (ver [`05-seguranca.md`](./05-seguranca.md)).

**Client Component** — um componente React que roda (também) no navegador do visitante, marcado com `"use client"` no topo do arquivo. Necessário para qualquer coisa interativa: `onClick`, `useState`, formulários. Contraste com **Server Component**.

**Controlador / operador / titular** — papéis da LGPD. Titular é a pessoa dona dos dados; controlador é quem decide para que eles são usados (a Sala do Banquete); operador é quem trata os dados em nome do controlador (ex: a hospedagem).

**CSP (Content-Security-Policy)** — header que diz ao navegador de quais origens a página pode carregar scripts, estilos, imagens e fontes. É a principal defesa em profundidade contra XSS. Ver [`05-seguranca.md`](./05-seguranca.md).

**CSS utility-first** — abordagem do Tailwind: classes pequenas de propósito único (`bg-red-500`, `p-4`) compostas diretamente no HTML/JSX, em vez de escrever regras CSS nomeadas à parte. Ver [`02-tailwind-css.md`](./02-tailwind-css.md).

**Escrita atômica** — gravar um arquivo de forma que ele nunca fique "pela metade": escreve-se num arquivo temporário e depois se renomeia por cima do original (`rename` é instantâneo). Se o processo cair no meio, o original continua intacto. Usado em `backend/transacoes.js`.

**Framework** — um conjunto de ferramentas e convenções que decide "a forma certa" de estruturar um projeto, em troca de dar bastante coisa pronta (roteamento, otimizações, build). Next.js é um framework construído em cima do React.

**hreflang** — anotação (no HTML e no sitemap) que diz aos buscadores "esta página tem uma versão em outro idioma, neste endereço". Evita que `/servicos` e `/en/servicos` sejam tratadas como conteúdo duplicado. `x-default` indica a versão para quem não fala nenhum dos idiomas listados.

**HSTS (Strict-Transport-Security)** — header que obriga o navegador a só acessar o site por HTTPS durante um período, mesmo que alguém mande um link `http://`.

**Idempotência** — propriedade de uma operação que pode ser repetida sem mudar o resultado depois da primeira vez. O webhook do Mercado Pago pode chegar duplicado; com idempotência, a segunda chegada é reconhecida e ignorada (sem gravar nem mandar e-mail de novo).

**LGPD** — Lei Geral de Proteção de Dados (Brasil). Entre outras coisas, exige minimizar quais dados pessoais você coleta e por quanto tempo guarda. Influencia diretamente a decisão do formulário de Orçamento (ver [`07-protecao-de-dados.md`](./07-protecao-de-dados.md)).

**Locale** — identificador de idioma/região, ex: `pt`, `en`. É o que decide qual arquivo de tradução (`lib/i18n/messages/pt.json` ou `en.json`) é usado.

**next-intl** — biblioteca usada para internacionalização (i18n) do site. Ver [`04-i18n.md`](./04-i18n.md).

**next/font** — sistema do Next.js para carregar fontes (do Google Fonts ou locais) de forma otimizada: baixa a fonte durante o build e serve pelo próprio domínio, em vez do navegador buscar direto no Google a cada visita.

**Nonce** — número aleatório, único por requisição, usado na CSP para liberar só os scripts inline que o servidor marcou. Mais seguro que `'unsafe-inline'`, mas exige renderizar a página a cada visita (perde a geração estática).

**Normalização Unicode (NFC)** — o mesmo caractere visível pode ser codificado de formas diferentes ("é" como um caractere só, ou "e" + acento combinante). Normalizar para NFC converte tudo para a forma composta antes de validar ou comparar texto.

**npm / package.json** — `npm` é o gerenciador de pacotes do Node.js (instala bibliotecas de terceiros). `package.json` é o arquivo que lista quais bibliotecas o projeto usa (`dependencies`) e os comandos disponíveis (`scripts`, ex: `npm run dev`).

**Path traversal** — ataque que usa `../` num caminho para escapar da pasta permitida e ler ou escrever arquivos arbitrários (ex: `../../etc/passwd`).

**Price tampering (manipulação de preço)** — quando o preço de algo vem do navegador do cliente em vez de ser definido pelo servidor, o cliente pode simplesmente mandar o valor que quiser. Regra: o cliente diz *o que* quer comprar; o servidor decide *quanto custa*.

**Prototype pollution** — ataque em JavaScript que usa chaves especiais como `__proto__` ou `constructor` para alterar o comportamento de todos os objetos da aplicação. Prevenido validando chaves contra uma lista fechada (`z.enum`, `Object.hasOwn`).

**Proxy (`proxy.ts`)** — arquivo especial do Next.js que roda no servidor antes de qualquer página, podendo inspecionar/redirecionar a requisição. Neste projeto, decide qual idioma aplicar com base na URL. Chamava-se `middleware.ts` até a versão 15 do Next.js.

**Quarentena (de arquivo)** — em vez de apagar ou sobrescrever um arquivo de dados inválido, movê-lo para outro nome e começar um novo. Os dados originais ficam preservados para recuperação manual.

**Rate limiting** — limitar quantas requisições um mesmo cliente pode fazer num intervalo (ex: 5 por minuto). Protege contra força bruta e flood.

**Rota dinâmica** — uma pasta entre colchetes dentro de `app/`, como `[locale]`, que aceita qualquer valor naquele segmento da URL. O valor fica disponível no código.

**Server Component** — um componente React que roda **só no servidor**; o navegador recebe apenas o HTML já pronto, sem o código JavaScript daquele componente. É o padrão no App Router do Next.js (todo componente é Server Component a menos que marcado como Client Component). Reduz a quantidade de JavaScript enviada ao navegador.

**SSG (Static Site Generation)** — gerar o HTML de uma página **durante o build**, não a cada requisição. Mais rápido para o visitante, porque o servidor só entrega um arquivo pronto. Usamos isso para as páginas de idioma (`generateStaticParams`).

**SSRF (Server-Side Request Forgery)** — fazer o servidor buscar uma URL escolhida pelo atacante (por exemplo, um endereço interno da rede). Foi o vetor de CVEs recentes no otimizador de imagens do Next.js.

**Tailwind CSS** — biblioteca de CSS utility-first usada para estilizar o site. Ver [`02-tailwind-css.md`](./02-tailwind-css.md).

**Timing attack** — descobrir um segredo medindo quanto tempo o servidor leva para responder: uma comparação comum (`===`) para no primeiro caractere diferente, então tokens "mais certos" demoram um pouco mais. Prevenido com comparação em tempo constante (`crypto.timingSafeEqual`).

**Turbopack** — o compilador usado pelo `next dev`/`next build` neste projeto (sucessor do Webpack dentro do ecossistema Next.js). Mais rápido para recompilar durante o desenvolvimento.

**TypeScript** — JavaScript com um sistema de tipos por cima. Permite que o editor e o compilador avisem sobre erros (ex: passar um número onde se esperava texto) antes do código rodar, em vez de descobrir o bug em produção.

**WCAG** — Web Content Accessibility Guidelines, a norma internacional de acessibilidade web. O nível AA (o alvo deste site) inclui, por exemplo, contraste mínimo de 4,5:1 para texto e foco visível em todo elemento interativo.

**XSS (Cross-Site Scripting)** — vulnerabilidade em que um atacante consegue injetar código JavaScript malicioso numa página (por exemplo, via um campo de formulário mal validado que depois é exibido sem tratamento). Uma das razões pelas quais o formulário de Orçamento valida todos os campos antes de qualquer uso, e pelas quais o site tem uma CSP.

**zod** — biblioteca de validação de schemas usada no formulário de Orçamento (`lib/validation/budget.ts`). Descreve "a forma que os dados devem ter" (tipo, tamanho mínimo/máximo, formato) e, dado um valor qualquer, diz se ele é válido e, se não for, por quê.
