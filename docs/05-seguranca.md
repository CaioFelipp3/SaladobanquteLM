# 05 — Segurança (DevSecOps)

Este documento registra cada medida de segurança aplicada no site, o que ela previne e por quê. O relatório completo da auditoria pré-produção (o que foi testado, o que foi encontrado e o que ficou como recomendação) está em [`08-auditoria-seguranca.md`](./08-auditoria-seguranca.md). A parte de dados pessoais (LGPD) está em [`07-protecao-de-dados.md`](./07-protecao-de-dados.md).

## Superfície de ataque, em uma frase

O site é quase todo **estático**: as páginas são geradas no build (SSG). O único endpoint nosso que recebe dados é `POST /api/checkout` (compra de ingressos, ver abaixo), e a única página renderizada a cada visita é `/ingressos/retorno`. As únicas entradas externas são a URL (idioma e caminho), o cabeçalho `Accept-Language`, o otimizador de imagens do Next.js (`/_next/image`) e o formulário de orçamento, que roda inteiro no navegador. O mapa detalhado de cada ponto de entrada está no [relatório da auditoria](./08-auditoria-seguranca.md#mapa-de-superfície-de-ataque).

## Headers de segurança (`next.config.ts`)

Todo header abaixo é enviado em **todas as respostas** do site (configurado uma vez, vale para toda página):

### `Content-Security-Policy`

**O que previne:** XSS e injeção de conteúdo. A CSP é uma lista branca: diz ao navegador de onde ele pode carregar scripts, estilos, imagens e fontes. Mesmo que um atacante conseguisse injetar uma tag `<script src="https://site-malicioso">` na página, o navegador se recusaria a executá-la.

```
default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
img-src 'self' blob: data:; font-src 'self'; connect-src 'self'; object-src 'none';
base-uri 'self'; form-action 'self'; frame-ancestors 'none'
```

- `object-src 'none'`: bloqueia plugins (Flash, Java), um vetor clássico de execução de código.
- `base-uri 'self'`: impede que um `<base href>` injetado redirecione todos os links relativos da página para outro domínio.
- `frame-ancestors 'none'`: ninguém pode embutir o site em `<iframe>` (versão moderna do `X-Frame-Options`).
- **Sem `upgrade-insecure-requests`, de propósito.** Essa diretiva manda o navegador buscar todo recurso `http://` como `https://`. Ela chegou a ser adicionada nesta auditoria e **quebrou o site** em qualquer servidor HTTP sem TLS: `npm start` local, acesso pelo IP da rede (celular) e o Safari mesmo em `localhost`. CSS, JS e fontes falhavam e a página aparecia crua. O teste automático não pegou porque usava só o Chromium em `localhost`, que tem uma exceção para esse endereço. Em produção ela não acrescenta nada: a Vercel só serve HTTPS (com HSTS) e todos os recursos do site usam URLs relativas. Lição: testar também no WebKit (o motor do Safari) e por um endereço que não seja `localhost`.

**A concessão consciente — `'unsafe-inline'` em `script-src`:** o Next.js injeta pequenos scripts inline em cada página para a hidratação do React. A forma "estrita" de liberar só esses scripts é um *nonce* (um número aleatório por requisição), mas nonce exige renderizar cada página **a cada visita**, perdendo a geração estática e o cache de CDN. Para este site, o ganho real seria pequeno: nenhum dado de usuário é renderizado como HTML (o React escapa todo texto e não usamos `dangerouslySetInnerHTML`). Se um dia o site passar a exibir conteúdo vindo de usuários ou de um CMS, a troca para nonce passa a valer a pena.

**Verificado na prática:** um script com Chromium visita as 8 páginas (e o carregamento foi conferido também no WebKit, por `localhost` e pelo IP da rede), escuta o evento `securitypolicyviolation` e confere que a página hidratou (o menu responde a clique). Resultado: zero violações.

**Um caso real encontrado nesse teste:** a página de Orçamento disparava uma violação de `eval`. Causa: o zod 4 testa `new Function("")` ao carregar, para decidir se pode compilar validadores otimizados. Ele se recupera sozinho quando o eval é bloqueado, mas o navegador registra a violação. A correção foi `z.config({ jitless: true })` em `lib/validation/budget.ts`, que mantém a mesma validação sem nenhum eval.

### `X-Frame-Options: DENY`

**O que previne:** clickjacking. Sem esse header, outro site poderia carregar o seu dentro de um `<iframe>` invisível, sobrepor botões falsos por cima e enganar o visitante a clicar em algo. Redundante com `frame-ancestors` da CSP, mas cobre navegadores antigos.

### `X-Content-Type-Options: nosniff`

**O que previne:** MIME sniffing. Alguns navegadores tentavam "adivinhar" o tipo real de um arquivo em vez de confiar no `Content-Type` declarado — isso podia ser abusado para fazer o navegador executar como script algo que deveria ser só texto ou imagem.

### `Referrer-Policy: strict-origin-when-cross-origin`

**O que previne:** vazamento da URL completa para sites externos. Para links externos (WhatsApp, Instagram, Maps), o navegador envia só o domínio (`saladobanquetelm.com.br`), nunca o caminho.

### `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`

**O que previne:** ataques de downgrade para HTTP. Depois da primeira visita, o navegador recusa acessar o site sem HTTPS por 2 anos. A Vercel já adiciona isso; deixamos explícito como defesa em profundidade.

### `Permissions-Policy`

`camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()` — o site não usa nenhum desses recursos do navegador, então todos ficam desligados. `browsing-topics=()` também tira o site do sistema de interesses publicitários do Chrome.

### `Cross-Origin-Opener-Policy: same-origin`

**O que previne:** que uma janela aberta por outro site mantenha uma referência (`window.opener`) para a aba do nosso site. Complementa o `rel="noopener"` dos links.

### Sem `X-Powered-By`

`poweredByHeader: false` remove o header `X-Powered-By: Next.js`. Anunciar a stack facilita para quem procura alvos de uma CVE específica.

## Otimizador de imagens restrito

`images.localPatterns` em `next.config.ts` faz o endpoint `/_next/image` aceitar **só** arquivos de `/images/**`, sem query string. Testado:

| Requisição | Resultado |
|---|---|
| `/_next/image?url=/images/marca/logo.png` | 200 |
| `/_next/image?url=/favicon.ico` | 400 |
| `/_next/image?url=/images/marca/logo.png?x=1` | 400 |
| `/_next/image?url=https://evil.com/a.png` | 400 |

O otimizador de imagens foi o vetor de várias CVEs recentes do Next.js (SSRF, RCE com AVIF). Restringir o que ele aceita reduz o que um atacante consegue mandar para ele processar.

## Dependências

- `next` atualizado de 16.3.0 para 16.4.0: corrige uma CVE **crítica** de execução remota de código no Image Optimizer e mais 8 advisories (SSRF, cache poisoning).
- `npm audit` no frontend: de 11 vulnerabilidades (1 crítica) para 5, todas da mesma cadeia: `braces` ← `micromatch` ← `fast-glob` ← `eslint-config-next`. São **só de desenvolvimento** (rodam no `npm run lint`, nunca vão para produção) e o `braces` 3.0.3 é a última versão publicada, sem correção disponível. Risco aceito e registrado.
- Versões de `next`, `react` e `eslint-config-next` fixadas sem `^` no `package.json`, para que um `npm install` não traga uma versão nova sem revisão.

**Rotina recomendada:** rodar `npm audit` e `npm outdated` antes de cada deploy importante, e ler as notas de versão do Next.js quando sair patch de segurança.

## Formulário de Orçamento

### Por que o formulário não passa por um servidor nosso

O envio é 100% resolvido no navegador: valida os dados, monta uma mensagem formatada e abre `wa.me/...` (nova aba) ou `mailto:...` (cliente de e-mail do visitante). Nenhum dado do formulário trafega para um servidor nosso, não fica em log e não é armazenado em lugar nenhum sob nosso controle.

### "Validação só no cliente é inútil" — aqui não é bem assim

A regra geral é verdadeira: quando há um servidor recebendo dados, um atacante pode ignorar o navegador e mandar a requisição direto, então a validação precisa ser refeita no servidor. **Neste formulário não existe esse servidor.** O destino é o WhatsApp ou o e-mail da empresa, e qualquer pessoa já pode mandar qualquer texto para esses canais sem passar pelo site. Burlar a validação do formulário não dá acesso a nada que o atacante já não tivesse.

O papel da validação aqui é outro: **garantir que a mensagem que chega à equipe seja bem formada e não engane quem a lê**. Se uma fase futura gravar orçamentos num banco (ex: painel admin), o mesmo schema zod **precisa** rodar também no servidor.

### O que o schema (`lib/validation/budget.ts`) garante

Testado com uma bateria de 29 payloads maliciosos (antes das correções: 12 falhas; depois: 0):

- **Nome**: normalizado para NFC e restrito a letras (inclusive acentos combinantes), espaço, hífen e apóstrofo. `<script>`, `'; DROP TABLE--` e `../../etc/passwd` são recusados, não "limpos". Preferimos recusar entrada claramente inválida a adivinhar a intenção.
- **Normalização NFC**: "é" pode chegar como um caractere (U+00E9) ou como "e" + acento combinante (U+0301), comum em texto colado. Sem normalizar, um "José" legítimo era recusado.
- **Sem quebra de linha** nos campos de uma linha: impede injetar "linhas" falsas na mensagem final (ex: `João\nTelefone: 000`).
- **Telefone**: só dígitos e `+ ( ) - .`, até 20 caracteres, DDI 55 opcional. **Antes**, o código só contava os dígitos, e `<b>27999999999</b>` passava.
- **Data**: formato exato `AAAA-MM-DD`, data real de calendário (30/02 é recusado), não no passado, até 3 anos à frente. **Antes**, `Date.parse` aceitava `"2027"` e `9999-12-31`.
- **Convidados**: só dígitos, de 1 a 1000. **Antes**, `z.coerce.number` aceitava `0x10` (16) e `1e3` (1000).
- **Mensagem**: até 500 caracteres; rejeita caracteres de controle e caracteres invisíveis de *spoofing*: controles bidirecionais (U+202E inverte a ordem visual do texto), zero-width space e similares. O zero-width joiner fica permitido porque compõe emojis.
- **Serviço**: precisa ser um dos ids da lista (`z.enum`); `__proto__` e `../` são recusados.

### Montagem da URL

`encodeURIComponent()` em `buildWhatsappUrl`/`buildMailtoUrl` (`lib/data/contacts.ts`): qualquer `&`, `?`, `#` ou quebra de linha digitada vira texto literal. Testado no navegador com a mensagem `?text=hack#frag` — a URL final tem exatamente um parâmetro (`text`), com o texto intacto.

### XSS no formulário

Nenhum dado do formulário é renderizado de volta na página como HTML. As mensagens de erro são chaves de tradução fixas, e a mensagem de sucesso mostra só textos nossos e a URL gerada (num `href`, escapado pelo React). `dangerouslySetInnerHTML` não é usado em nenhum lugar do projeto.

### Spam e flood

Como não há servidor, não há o que derrubar: cada envio só abre o WhatsApp ou o e-mail **do próprio visitante**, e ele ainda precisa apertar "enviar" lá. Um bot que automatizasse isso estaria mandando mensagens da própria conta, e o controle de spam é do WhatsApp/Gmail. Os botões ficam desabilitados por 1,2 s após o clique, para evitar abrir duas abas com um duplo clique. Um CAPTCHA aqui só criaria atrito para clientes reais.

## Links externos com `rel="noopener noreferrer"`

Todo `target="_blank"` do site tem `rel="noopener noreferrer"` — conferido no HTML renderizado (17 links, 0 sem `rel`). O `window.open` do formulário usa `"noopener,noreferrer"`. **O que previne:** sem `noopener`, a aba aberta ganha acesso a `window.opener` e poderia redirecionar a aba original para uma página de phishing.

## Segredos e variáveis de ambiente

- A única variável sensível é `MERCADO_PAGO_ACCESS_TOKEN`, lida só no servidor por `lib/payments/mercadopago.ts`, que começa com `import "server-only"`: se esse arquivo for importado por um componente do navegador, o build falha. Ela é cadastrada na Vercel e documentada, sem valor, no `.env.example` da raiz. Os dados de contato (`lib/data/contacts.ts`) são públicos por natureza e ficam no código.
- Nenhuma variável `NEXT_PUBLIC_*` existe. **Regra:** nada sensível leva esse prefixo, porque toda variável com ele vai para o JavaScript do navegador.
- `.gitignore` cobre **todas** as variantes de `.env` (`.env*`, com exceção dos `.env.example`). Antes só cobria `.env`, `.env.local` e `.env.*.local`, deixando de fora `.env.production` e `.env.development`, que o Next.js carrega automaticamente e costumam guardar segredos. Também cobre `*.pem`, `.vercel` e `.claude/settings.json` (permissões pessoais do Claude Code, com caminhos da máquina de quem usa; antes era versionado e servido publicamente pela produção estática).
- **Histórico do git verificado:** busca por padrões de token do Mercado Pago (`APP_USR-`), chaves AWS, tokens do GitHub, chaves privadas e atribuições `token|secret|password = "..."` em todos os commits. Nenhum segredo real foi commitado; só os placeholders do `.env.example`.

## Exposição de informação

- **Nenhum arquivo do repositório é servido**: o Next.js só publica a pasta `public/` (testado: `/backend/server.js`, `/package.json`, `/.env`, `/docs/...` → 404). Isso corrige um problema real da produção atual, detalhado no [relatório](./08-auditoria-seguranca.md).
- Sem `console.log` no código do frontend.
- Página 404 própria, traduzida, sem detalhes internos.
- `public/` contém só imagens do site e a logo.

## Checkout de ingressos (`/api/checkout`)

O antigo backend Express foi substituído por um Route Handler do Next.js e removido. O fluxo completo está em [`09-checkout-ingressos.md`](./09-checkout-ingressos.md). As defesas:

- **Preço só no servidor.** O navegador envia `{ ticketId, quantity, locale }`; o preço vem de `lib/data/tickets.ts`. Campos extras no corpo (ex.: `price: 0.01`) são descartados pelo schema zod.
- **Validação estrita:** ingresso precisa existir no catálogo (`find` por igualdade, então `__proto__` e `constructor` nunca casam), quantidade inteira de 1 ao máximo por compra, idioma `pt` ou `en`. Pedido inválido responde 400 e **não chega** ao Mercado Pago.
- **CSRF:** só aceita `Content-Type: application/json` (um `<form>` comum não consegue enviar) e exige `Origin` com o mesmo host acessado (`Host`/`x-forwarded-host`). Recusa `Origin` ausente, `null` e domínios parecidos (`site.com.evil.example`).
- **Limites:** corpo até 1 KB (conferido pelo `Content-Length` antes de ler e de novo depois); só `POST` (outros métodos → 405).
- **Erros sem vazamento:** falha do Mercado Pago responde 502 com um código genérico; o detalhe fica só no log do servidor.
- **Página de retorno:** ignora o `?status=` da URL e consulta a API; exige o `external_reference` (UUID aleatório por pedido), o que impede ver pagamentos de outras pessoas trocando o `payment_id` (IDOR); `payment_id` só com dígitos (texto arbitrário não é refletido na mensagem de ajuda do WhatsApp); `noindex` e fora do sitemap; não mostra dados do comprador.
- **Redirecionamento:** o popup só segue um link `https://` cujo domínio seja do Mercado Pago (defesa contra redirecionamento aberto).
- **URL de retorno fixa:** usa `SITE_URL` (ou a URL do Preview na Vercel, ou o domínio público), nunca o `Host` da requisição.

**Testes executados** (servidor falso do Mercado Pago, Chrome e Safari, `localhost` e IP da rede): 28 ataques na API, fluxo completo de compra, 8 cenários da página de retorno, axe sem violações no popup e na página de retorno e CSP sem violações nas 9 rotas.

## SEO / Open Graph

Não é uma medida de segurança em si, mas fica registrado aqui: cada página tem metadata própria via `lib/seo/metadata.ts` (canonical, hreflang com `x-default`, Open Graph e Twitter), `metadataBase` absoluto, e o site agora tem `robots.txt` e `sitemap.xml`. A 404 não declara canonical.
