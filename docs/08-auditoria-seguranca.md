# 08 — Relatório da auditoria pré-produção

| | |
|---|---|
| **Data** | 7 de outubro de 2026 |
| **Branch** | `atualizacao` (nenhuma alteração na `main`) |
| **Escopo** | App Next.js (frontend), backend Express (`backend/`), configuração, dependências, histórico do git, site em produção |
| **Método** | Verificação automatizada (build, lint, tipos, audit), leitura linha a linha, testes práticos com navegador real (Chromium via Playwright), auditoria de acessibilidade (axe-core) e baterias de payloads maliciosos |

## Resumo

| Severidade | Encontrados | Corrigidos | Pendentes / aceitos |
|---|---|---|---|
| Crítica | 3 | 3 | 0 |
| Alta | 6 | 5 | 1 (só em produção atual; corrige no merge) |
| Média | 12 | 12 | 0 |
| Baixa / qualidade | 17 | 15 | 2 aceitos |

Os três críticos: uma CVE de execução remota de código no Next.js 16.3.0, a manipulação de preço no backend e o `nodemailer` com injeção de comandos SMTP. Nenhum dado pessoal é armazenado pelo site em produção. As pendências que restam são de **conteúdo e decisão de negócio** (ver [Antes do merge](#antes-do-merge-checklist)).

## Etapa 1 — Verificação automatizada

| Verificação | Antes | Depois |
|---|---|---|
| `npm run build` | ✅ sem erros nem warnings | ✅ sem erros nem warnings; 8 páginas SSG + robots/sitemap estáticos |
| `npm run lint` | ✅ 0 problemas | ✅ 0 problemas |
| `npx tsc --noEmit` | ✅ 0 erros | ✅ 0 erros |
| `npm audit` (frontend) | ❌ 11 (1 crítica, 10 altas) | ⚠️ 5 altas, só de desenvolvimento, sem correção publicada |
| `npm audit` (backend) | ❌ impossível: sem `package-lock.json` | ✅ 0 em produção; 3 altas só no `nodemon` (dev) |
| Dependências desatualizadas | `next`, `react`, `next-intl`, `zod` atrás | Atualizadas. Sobram majors que exigem migração: `eslint` 10, `typescript` 7, `@types/node` 26; no backend, `express` 5, `dotenv` 18, `express-rate-limit` 8 |
| Dependências não usadas | — | Nenhuma no frontend nem no backend. A variável `MERCADO_PAGO_PUBLIC_KEY`, que o código não lia, saiu do `.env.example` na limpeza pós-auditoria |

## Mapa de superfície de ataque

| Ponto de entrada | Tipo | Risco | Mitigação |
|---|---|---|---|
| URL / segmento `[locale]` | Parâmetro de rota | Locale arbitrário chegar ao `import()` dos dicionários (path traversal) | `hasLocale()` antes do import em `lib/i18n/request.ts` e no layout; valor fora de `pt`/`en` → 404 |
| Header `Accept-Language` | Cabeçalho | Manipular o redirecionamento de idioma | Tratado pelo next-intl; só redireciona entre locales conhecidos |
| Caminhos inexistentes (`/xyz`, `/../`) | Rota | Vazamento de arquivos, 404 com detalhes internos | Só `public/` é servido; 404 própria sem detalhes |
| `/_next/image?url=` | Endpoint do Next | SSRF, DoS e RCE (CVEs recentes) | Next 16.4.0 + `localPatterns` só para `/assets/**` sem query |
| Formulário de orçamento | Entrada de usuário (só no navegador) | Mensagem enganosa para a equipe, injeção na URL, XSS | Schema zod endurecido, `encodeURIComponent`, nada renderizado como HTML |
| Links `wa.me`, `mailto:`, Instagram, Maps | Integrações de terceiros | Tabnabbing, vazamento de Referer | `rel="noopener noreferrer"`, COOP, Referrer-Policy |
| Cookie `NEXT_LOCALE` | Cookie | Nenhum dado sensível | `SameSite=Lax`, sessão, só "pt"/"en" |
| `robots.txt` / `sitemap.xml` | Arquivos gerados | Exposição de rotas privadas | Só lista as 4 páginas públicas × 2 idiomas |
| **Backend** `POST /criar-preference` | API (fora do ar) | Manipulação de preço, prototype pollution | Catálogo no servidor com `Object.hasOwn` |
| **Backend** `POST /webhook/pagamento` | API (fora do ar) | Webhook forjado, replay, e-mail duplicado, flood | HMAC em tempo constante, id numérico, idempotência antes do e-mail, rate limit |
| **Backend** `GET /transacoes` | API com PII (fora do ar) | Força bruta no token, timing attack | Token ≥ 32 caracteres, comparação em tempo constante, 5 req/min |
| **Backend** `transacoes.json` | Arquivo lido e escrito | Corrupção, perda de dados, race condition, leitura por outros usuários | Validação de estrutura, quarentena, escrita atômica, lock, `0600` |

## Achados

Legenda de status: ✅ corrigido · ⚠️ aceito/pendente · 🔜 corrige-se no merge.

### Críticos

**C1 — RCE no Image Optimizer do Next.js 16.3.0** ✅ `9968ddd`
O `npm audit` apontou CVE crítica (execução remota de código com imagens AVIF) e mais 8 advisories no `next`. Atualizado para 16.4.0.

**C2 — Backend: preço do ingresso definido pelo cliente** ✅ `e7f09b7`
`POST /criar-preference` usava `valor` e `ingresso` do corpo da requisição. Qualquer pessoa podia criar um pagamento de R$ 0,01 para qualquer ingresso e receber o e-mail de confirmação. O preço agora vem de `CATALOGO_INGRESSOS`, no servidor. Teste: enviar `valor: "0.01"` → 400; `ingressoId: "__proto__"` → 400.

**C3 — Backend: `nodemailer` 6.10 com 15 advisories altos** ✅ `e7f09b7`
Incluem injeção de comandos SMTP, envio para domínio controlado por atacante e leitura arbitrária de arquivos. Atualizado para 10.0.16 (exige Node ≥ 20; `engines` ajustado).

### Altos

**A1 — Produção atual expõe código-fonte e configurações** 🔜
A `main` é publicada como site estático, e nesse modo a Vercel serve **qualquer arquivo do repositório**. Verificado em `saladobanquetelm.vercel.app`:

| URL | Status |
|---|---|
| `/backend/server.js` | 200 |
| `/backend/server.js.bak` | 200 |
| `/backend/.env.example` | 200 |
| `/backend/package.json` | 200 |
| `/.claude/settings.json` | 200 |

Nenhum desses arquivos contém segredo real (conferido), mas expõem a lógica de pagamento, nomes de variáveis e a estrutura interna. O `.claude/settings.json` deixou de ser versionado em `de08bef`. **No Next.js isso não acontece**: só `public/` é servido (testado: todos → 404). Corrige-se no merge. As cópias `.bak`/`.backup` foram removidas em `84e4a46`. A produção também não envia CSP nem os demais headers, só o HSTS da Vercel.

**A2 — Backend: arquivo corrompido apaga todo o histórico de transações** ✅ `e7f09b7`
`loadTransacoes()` devolvia `[]` quando o `JSON.parse` falhava. Na escrita seguinte, `salvarTransacao` gravava `[nova]` por cima do arquivo, **apagando todas as transações anteriores**. Agora o arquivo inválido vai para quarentena (`transacoes.corrompido-<ts>.json`) e os dados ficam recuperáveis.

**A3 — Backend: JSON válido com estrutura errada perde transações em silêncio** ✅ `e7f09b7`
Um arquivo com `{}` ou `null` passava pelo `JSON.parse`, e `.some()` lançava `TypeError`. O erro era engolido pelo `.catch` e **toda transação nova se perdia**, enquanto o webhook respondia 200 ao Mercado Pago (que então não reenvia). Agora a estrutura é validada (array de objetos com `transactionId`).

**A4 — Backend: escrita não atômica** ✅ `e7f09b7`
`writeFile` direto no arquivo final: uma queda no meio deixava o JSON pela metade (e caía no A2). Agora a escrita usa arquivo temporário + `rename`, que é atômico.

**A5 — Formulário: validação de telefone ignorava tudo que não fosse dígito** ✅ `ed622ef`
`<b>27999999999</b>` e `javascript:27999999999` eram aceitos, porque o código só contava os dígitos.

**A6 — Contraste insuficiente nos elementos principais** ✅ `963e641`
Botões rosa com texto branco a 3,9:1, links rosa a 3,6:1, botão do WhatsApp a 2,0:1, data em dourado a 2,3:1 e borda dos campos a 1,1:1 (WCAG AA exige 4,5:1 para texto e 3:1 para componentes). Ver [Acessibilidade](#acessibilidade).

### Médios

| # | Achado | Status |
|---|---|---|
| M1 | Sem Content-Security-Policy | ✅ `feb00a0` |
| M2 | Otimizador de imagens aceitava qualquer caminho e query string | ✅ `feb00a0` |
| M3 | Mensagem aceitava caracteres de controle e bidi (U+202E inverte o texto exibido no WhatsApp) | ✅ `ed622ef` |
| M4 | Data: `Date.parse` aceitava `"2027"`, `30/02` e o ano 9999 | ✅ `ed622ef` |
| M5 | Convidados: `z.coerce.number` aceitava `0x10` e `1e3` | ✅ `ed622ef` |
| M6 | E-mail coletado e descartado (não entrava na mensagem) — minimização LGPD | ✅ `ed622ef` (campo removido) |
| M7 | Sem política de privacidade nem aviso de tratamento de dados | ✅ `23ca345` |
| M8 | Backend: e-mail enviado antes da checagem de idempotência (webhook repetido = e-mail duplicado) | ✅ `e7f09b7` |
| M9 | Backend: sem e-mail do pagador, a notificação ia para `desconhecido@email.com` (domínio de terceiro) | ✅ `e7f09b7` |
| M10 | Backend: token de admin comparado com `!==` (timing attack) | ✅ `e7f09b7` |
| M11 | Backend: sem handler de erro — o Express devolve stack trace em HTML fora de `NODE_ENV=production` | ✅ `e7f09b7` |
| M12 | Foco escondido: ao enviar o formulário com erro, o menu fixo cobria o campo focado (WCAG 2.4.11) | ✅ `963e641` |

### Baixos e qualidade

| # | Achado | Status |
|---|---|---|
| B1 | Nome "José" com acento decomposto (NFD) era **recusado** (falso positivo) | ✅ `ed622ef` |
| B2 | Sem feedback se o navegador bloqueasse a aba do WhatsApp ou não houvesse app de e-mail — o usuário via "Pronto!" sem nada ter aberto | ✅ `5342f3d` (link manual) |
| B3 | Classes de borda conflitantes nos campos inválidos (`border-banquete-border` + `border-red-500`) | ✅ `5342f3d` |
| B4 | Live regions aninhadas e `role="alert"` em cada erro (anúncio duplicado em leitores de tela) | ✅ `5342f3d` |
| B5 | 404 padrão do Next, em inglês, sem `lang`, menu ou rodapé | ✅ `5342f3d` |
| B6 | Páginas internas herdavam as tags do Twitter da Home; sem `x-default`; 404 com canonical para a Home | ✅ `bee30c5` |
| B7 | Sem `robots.txt` e `sitemap.xml` (404 em produção) | ✅ `bee30c5` |
| B8 | `priority` em `next/image` depreciado no Next 16; preload numa imagem abaixo da dobra | ✅ `963e641` |
| B9 | 5 fotos de 5,4–6,3 MB (3543px) para exibição de até ~1800px | ✅ `594d8a7` (33 MB → 10 MB) |
| B10 | Card de evento único esticava até 860px de largura | ✅ `bee30c5` |
| B11 | Código duplicado: classes de botão e título (até 5×), SVG do WhatsApp (2×), metadata (4×) | ✅ `7f75f8f`, `bee30c5` |
| B12 | Site legado (41 MB) e backups do backend ainda no repositório | ✅ `84e4a46` |
| B13 | Backend: id do webhook entrava na URL da API sem validação; redirect HTTPS refletia o header `Host`; body de até 1 MB; logs com o objeto de erro completo | ✅ `e7f09b7` |
| B14 | Backend sem `package-lock.json` (builds não reproduzíveis, audit impossível) | ✅ `e7f09b7` |
| B15 | `X-Powered-By: Next.js` exposto | ✅ `feb00a0` |
| B16 | `braces` (dev) sem correção publicada | ⚠️ aceito — só roda no lint |
| B17 | Ano do rodapé calculado no build (fica desatualizado em 1º de janeiro até o próximo deploy) | ⚠️ aceito — qualquer deploy atualiza |

## Testes executados

Os scripts de teste ficaram fora do repositório (scratchpad da sessão). Ver a recomendação R8.

### Formulário — bateria de payloads (29 casos, direto no schema)

Antes das correções: **12 falhas**. Depois: **0**. Casos incluídos:

`<script>alert(1)</script>` · `'; DROP TABLE clientes;--` · `../../etc/passwd` · 10.000 caracteres · `João\nTelefone: 000` · bidi U+202E · zero-width U+200B · "José" em NFD · `<b>27999999999</b>` · `javascript:2799…` · `+55 (27) 99999-9999` · 5.000 dígitos · `\u0000` na mensagem · `__proto__` como serviço · `2027` · `2027-02-30` · `9999-12-31` · `0x10` · `1e3` · `-5` · `2.5` · `1001` · checkbox desmarcado.

### Formulário — ponta a ponta no Chromium (17 verificações)

Envio vazio mostra erros e foca o 1º campo inválido; nada é aberto com dados inválidos; nome com `<script>` é recusado; sem o checkbox, erro de privacidade; envio válido abre exatamente uma URL `https://wa.me/5527993093644` com um único parâmetro `text`; uma mensagem com `<b>`, `?text=` e `#` chega como texto literal; o e-mail não aparece na mensagem; o link manual tem a mesma URL e `rel="noopener noreferrer"`; os botões ficam desabilitados após o envio; `/privacidade` e `/en/privacidade` respondem 200; o rodapé tem o link da política.

### CSP e hidratação (8 rotas)

Zero violações de CSP e hidratação confirmada em `/`, `/servicos`, `/orcamento`, `/privacidade` e nas versões `/en`.

### Exposição de arquivos (servidor de produção local)

`/backend/server.js`, `/package.json`, `/.env`, `/.claude/settings.json`, `/docs/05-seguranca.md` e `/..%2f..%2fpackage.json` → todos 404.

### Backend (31 verificações)

Persistência: JSON malformado vai para quarentena com os dados preservados; `{}`, `null`, `[1,"x"]` e um payload `__proto__` vão para quarentena e a transação nova é salva; `Object.prototype` não é poluído; arquivo vazio vira lista vazia; **50 webhooks simultâneos com 25 ids → 25 gravados**, 25 recusados como duplicados; nenhum `.tmp` restante; permissão `600`; o lock libera após falha de disco.

HTTP: token ausente, quase igual ou com sufixo → 401, token correto → 200; preço vindo do cliente → 400; `__proto__`/`constructor`/`toString` como ingresso → 400; webhook sem assinatura → 401; id `../../v1/users/me` assinado → 401; assinatura válida → aceita; JSON malformado → 400 em JSON sem stack; 200 KB → 413; rota inexistente → 404 JSON; CORS de origem estranha → 403 sem stack; rajada no admin → 429; logs sem e-mail.

### Verificações de código

0 classes Tailwind inexistentes (464 tokens conferidos contra o CSS gerado); 0 conflitos de classe no mesmo elemento; 54 imports com o case exato do sistema de arquivos (o Linux da Vercel diferencia maiúsculas, o macOS não); 0 `==`/`!=`, `var`, `class=`, `for=`; 0 `dangerouslySetInnerHTML`, `eval`, `innerHTML`; 0 `console.*`; 0 `<img>` cru; 17 links `target="_blank"`, todos com `rel`; 0 textos de interface fora dos dicionários (o nome da marca no rodapé é intencional); 154 chaves de tradução em cada idioma, 0 divergências.

### Acessibilidade

axe-core (WCAG 2.0/2.1/2.2 A e AA) em 7 rotas × desktop (1280px) e mobile (375px), com o formulário em estado de erro: **0 violações**. Mais os testes de teclado: o primeiro Tab cai no "Pular para o conteúdo", Enter move o foco para o `<main>`, as setas navegam na galeria, Esc fecha o menu mobile e devolve o foco, e o campo focado fica visível abaixo do menu fixo.

Contraste corrigido com o **menor ajuste possível** na identidade visual: o rosa da marca ficou 13% mais escuro, no mesmo matiz. Valores e justificativa em `app/globals.css`.

### Responsividade

320, 375, 768 e 1280px × 5 páginas: 0 casos de rolagem horizontal ou elemento vazando da tela.

## Antes do merge (checklist)

1. **Configuração da Vercel.** O projeto em produção hoje é estático. Confirmar em *Settings → Build & Development* que o *Framework Preset* é **Next.js** (ou que a detecção automática está ativa) e abrir o **Preview Deployment** da branch `atualizacao` antes do merge.
2. **Conteúdo placeholder visível:** "[Data a confirmar]", "[Descrição do evento a preencher]", "[Descrição a preencher]" nos 9 serviços e "Imagem em breve". Isso não deve ir ao ar assim.
3. **Política de privacidade:** a Liliam precisa validar a retenção (12 meses) e o prazo de resposta (15 dias), e o texto precisa de revisão jurídica. Ver [`07-protecao-de-dados.md`](./07-protecao-de-dados.md).
4. **Revisar as traduções em inglês**, inclusive o texto novo da política.
5. **Depois do merge:** conferir que `https://www.saladobanquetelm.com.br/backend/server.js` responde 404 e que `curl -I` mostra os headers de segurança.

## Recomendações futuras

| # | Recomendação | Quando |
|---|---|---|
| R1 | Imagem de Open Graph dedicada (1200×630, < 300 KB). Hoje é a logo de 603×282 | Antes de divulgar links |
| R2 | `alt` descritivo para cada foto da galeria. Hoje é "Decoração da Sala do Banquete 3", genérico | Com o conteúdo real |
| R3 | Trocar a CSP para nonce se o site passar a renderizar conteúdo de usuários ou de um CMS | Fase com conteúdo dinâmico |
| R4 | ✅ Resolvida pelo checkout novo (sem arquivo JSON nem catálogo no Express). Texto original: Backend: preencher `CATALOGO_INGRESSOS`; migrar `transacoes.json` para um banco gerenciado (o lock em memória só vale para 1 processo; criptografia em repouso; retenção); validar a janela de tempo do `ts` do webhook contra replay; criar a página `/ingressos`, para onde os `back_urls` do Mercado Pago apontam e que não existe | Fase de e-commerce |
| R5 | ✅ Feita em `056ccea`. Texto original: Considerar Route Handlers do Next.js em vez do Express separado, para um deploy, um conjunto de headers e uma validação compartilhada (o mesmo schema zod no cliente e no servidor) | Fase de e-commerce |
| R6 | Majors pendentes: `eslint` 10, `typescript` 7, `express` 5 — cada um com migração própria | Manutenção |
| R7 | Acompanhar a correção do `braces` (cadeia do `eslint-config-next`) | `npm audit` periódico |
| R8 | Trazer para o repositório os testes desta auditoria (Playwright para e2e/CSP/axe, Vitest para o schema e o backend) e rodar em CI a cada PR | Próxima etapa |
| R9 | O header HSTS declara `preload`. Só submeter o domínio em hstspreload.org quando **todos** os subdomínios servirem HTTPS (a inclusão é difícil de reverter) | Opcional |
| R10 | O histórico do git carrega cerca de 45 MB de imagens (o repositório compactado tem ~41 MB). Limpar exigiria reescrever o histórico (`git filter-repo`), uma operação destrutiva que só vale a pena se o tamanho do clone virar problema | Opcional |

## Regressão encontrada depois da entrega

A CSP original desta auditoria incluía `upgrade-insecure-requests`. Ela **impedia o site de carregar** (CSS, JS e fontes falhavam) em qualquer servidor HTTP sem TLS: `npm start` local, acesso pelo IP da rede e o Safari mesmo em `localhost`. A bateria de testes não pegou porque rodava só no Chromium via `localhost`, que abre exceção para esse endereço.

A diretiva foi removida, já que em produção não acrescentava nada (a Vercel só serve HTTPS, com HSTS, e as URLs dos recursos são relativas). O carregamento foi reverificado em Chromium e WebKit, por `localhost` e pelo IP da rede, e as suítes de CSP, formulário e acessibilidade rodaram de novo sem falhas. Daqui para a frente, os testes de navegador devem incluir o WebKit e um acesso que não seja por `localhost` (soma-se à recomendação R8).

## Limpeza pós-auditoria

Depois da auditoria, uma rodada de limpeza procurou código morto, resíduos da migração e arquivos inúteis. Método: inventário de todos os arquivos, grafo de imports a partir dos pontos de entrada do Next, knip (arquivos, exports e dependências sem uso), checagem de chaves de tradução e tokens de tema, e detecção de classes Tailwind sem efeito (remover uma classe por vez e comparar layout e estilo no navegador, em 4 larguras × 5 páginas). Toda remoção de estilo foi validada com 38 screenshots comparados pixel a pixel antes/depois.

| Commit | O que saiu |
|---|---|
| `30d9e96` | Exports `redirect`/`useRouter`/`getPathname`, tipo `BudgetFormValues`, export interno do backend e variável de ambiente que o código não lia |
| `3d9a9ac` | 15 repetições de `text-banquete-dark` (herdado do `<body>`), regra CSS de fonte duplicada e 12 classes sem efeito (`mt-0`, `pb-0`, `w-full` em blocos, `min-h` de reserva para navegadores fora do suporte do Next 16, entre outras) |
| `15a8d3e` | Favicon padrão do template do Next.js (triângulo da Vercel), trocado pelo monograma da marca |
| `de08bef` | `.claude/settings.json` fora do versionamento; regras do `js/config.js` legado; `.gitignore` passa a cobrir todas as variantes de `.env` |

**Confirmado em uso e mantido:** todos os 30 arquivos de código, as 13 imagens de `public/` (sem duplicatas), as 143 chaves de tradução, todos os tokens do tema e todas as dependências. Os 30 `console.*` do backend são logs operacionais. Não havia TODO/FIXME, código comentado nem rotas de teste.

**Classes que parecem sem efeito, mas ficam:** transições (só agem no hover), `hidden`/`sm:hidden` (menu fechado), margens que colapsam com as vizinhas, classes da lista de eventos que só agem com 2+ eventos, e classes que só importam quando o texto quebra linha.

## Self-checkout de ingressos e remoção do backend

Depois da auditoria, a venda de ingressos foi reconstruída dentro do Next.js (`056ccea`), seguindo a recomendação R5, e o backend Express foi removido (`8e43a11`). Os achados de backend desta auditoria (C2, A2–A4, M8–M11, B13, B14) referem-se a esse código, que não existe mais. As correções serviram de base para o desenho novo, que elimina as causas: sem arquivo de dados, sem e-mail próprio, preço só no servidor. Detalhes em [`09-checkout-ingressos.md`](./09-checkout-ingressos.md) e na seção "Checkout de ingressos" de [`05-seguranca.md`](./05-seguranca.md).

Dois problemas foram encontrados e corrigidos **durante** o desenvolvimento, antes do commit:
- **IDOR na página de retorno:** a primeira versão mostrava status e valor de qualquer pagamento pelo `payment_id` da URL. Agora exige o `external_reference` do pedido.
- **Checagem de origem quebrada fora de `localhost`:** comparar o `Origin` com `request.url` recusava compras legítimas pelo IP da rede (no `next start`, a URL interna sai como `localhost`). Agora compara com o header `Host`/`x-forwarded-host`.

