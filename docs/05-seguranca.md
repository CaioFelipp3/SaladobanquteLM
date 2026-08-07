# 05 — Segurança (DevSecOps)

Este documento registra cada medida de segurança aplicada, o que ela previne e por quê. Vai crescer a cada etapa — o que está aqui hoje é só o que já foi implementado.

## Headers de segurança (`next.config.ts`)

Todo header HTTP abaixo é enviado em **todas as respostas** do site (configurado uma vez, vale para toda página):

### `X-Frame-Options: DENY`

**O que previne:** clickjacking. Sem esse header, outro site poderia carregar o seu dentro de um `<iframe>` invisível, sobrepor botões falsos por cima, e enganar o visitante a clicar em algo (ex: um botão de "curtir" que na verdade é um link de outro lugar). `DENY` impede que o site seja carregado dentro de qualquer `<iframe>`, em qualquer domínio — inclusive o próprio.

### `X-Content-Type-Options: nosniff`

**O que previne:** MIME sniffing. Alguns navegadores antigos tentavam "adivinhar" o tipo real de um arquivo em vez de confiar no `Content-Type` declarado pelo servidor — isso podia ser abusado para fazer o navegador executar como script algo que deveria ser só um arquivo de texto ou imagem (um vetor de XSS). Esse header força o navegador a respeitar o tipo declarado.

### `Referrer-Policy: strict-origin-when-cross-origin`

**O que previne:** vazamento de informação via header `Referer`. Por padrão, quando alguém clica de uma página do seu site para um link externo, o navegador informa ao site de destino a URL completa de onde veio (que pode conter dados sensíveis na query string). Essa política diz: para links dentro do mesmo site, manda a URL completa; para links externos, manda só o domínio (`saladobanquetelm.com.br`), nunca o caminho completo.

### `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`

**O que previne:** ataques de downgrade/interceptação (man-in-the-middle) que tentam forçar a conexão a cair para HTTP puro. Esse header diz ao navegador "sempre acesse este site por HTTPS pelos próximos 2 anos, mesmo que alguém tente te mandar um link `http://`" — depois da primeira visita, o navegador nem tenta HTTP de novo. A Vercel já adiciona isso automaticamente em produção; deixamos explícito aqui como defesa em profundidade (não depender só do comportamento implícito da plataforma).

### `Permissions-Policy: camera=(), microphone=(), geolocation=()`

**O que previne:** o site nunca precisa de câmera, microfone ou localização — esse header desliga essas permissões de propósito no navegador. Reduz o que um script malicioso conseguiria fazer caso algum dia um script de terceiro comprometido fosse carregado por engano.

## Links externos com `rel="noopener noreferrer"`

O site antigo já fazia isso corretamente nos links de WhatsApp/Instagram/Maps (`target="_blank" rel="noopener noreferrer"`), e vamos manter essa prática na migração. **O que previne:** sem `noopener`, a aba nova aberta por `target="_blank"` ganha acesso ao objeto `window.opener` — ou seja, o site que você acabou de abrir poderia redirecionar silenciosamente a aba original para uma página de phishing. `noreferrer` também evita vazar a URL de origem para o site de destino.

## `.gitignore`: protegendo segredos antes que existam

Já nesta etapa, garantimos que:

- `.env`, `.env.local`, `.env.*.local` nunca sejam commitados — é onde vão morar segredos reais (chaves de API, tokens) quando existirem.
- `js/config.js` (config sensível do site antigo) continua ignorado até ser removido de vez.
- Corrigimos um problema que o `.gitignore` antigo tinha: ele também ignorava `docs/` e `README.md`, o que teria feito toda essa documentação de aprendizado nunca ser salva no repositório — removido.

**Regra geral que vamos seguir a partir daqui:** nenhuma variável com dado sensível (token, senha, chave de API) leva o prefixo `NEXT_PUBLIC_`. Qualquer variável de ambiente com esse prefixo é enviada para o navegador e fica visível a qualquer pessoa que abrir o "Ver código-fonte" da página — então `NEXT_PUBLIC_` só pode ser usado para dados que já são públicos por natureza (ex: o número de WhatsApp, que já aparece escrito na própria página).

## Formulário de Orçamento: validação com `zod`

Todo campo é validado em `lib/validation/budget.ts` **antes** de qualquer link de WhatsApp/e-mail ser montado — se a validação falhar, nada é enviado. Alguns pontos que valem destacar:

- **Nome**: regex `/^[\p{L}\s'-]+$/u` — só aceita letras (com acento, `\p{L}` é Unicode-aware), espaço, hífen e apóstrofo. Um valor como `<script>alert(1)</script>` é rejeitado, não sanitizado — preferimos recusar entrada claramente inválida a tentar "limpar" e adivinhar a intenção do usuário.
- **Sem quebra de linha em campos de uma linha só** (nome, e-mail, telefone): impede que alguém digite `\n` dentro do campo "Nome" para fingir estar preenchendo outro campo na mensagem final (ex: `João\nTelefone: 000`, tentando injetar uma linha falsa na mensagem que chega no WhatsApp).
- **Data do evento**: rejeitada se não for uma data válida ou se for anterior a hoje.
- **Número de convidados**: só aceita inteiro entre 1 e 1000.
- Tudo isso é reforçado por `encodeURIComponent()` na hora de montar a URL do `wa.me`/`mailto:` — mesmo que algo escapasse da validação, não seria possível quebrar a estrutura da URL ou injetar parâmetros extra.

**Por que validar client-side é suficiente aqui:** como o formulário não envia dados a um backend nosso (ver abaixo), não existe um servidor nosso para atacar com dados maliciosos — o "destino" dos dados é sempre o próprio WhatsApp/cliente de e-mail do visitante, que tratam a entrada como texto simples. Se numa fase futura o formulário passar a gravar dados em um banco (ex: painel admin vendo solicitações), a mesma validação **precisará ser refeita no servidor**, porque validação client-side nunca é confiável sozinha quando há um backend real do outro lado — um atacante pode simplesmente não usar o navegador e mandar a requisição direto.

## Formulário de Orçamento: por que não existe backend próprio (ainda)

O envio é 100% resolvido no navegador: valida os dados, monta uma mensagem formatada e abre `wa.me/...` (nova aba) ou `mailto:...` (cliente de e-mail do usuário). Nenhum dado do formulário trafega para um servidor nosso, não fica em nenhum log, não é armazenado em lugar nenhum sob nosso controle.

**Por que isso é bom para LGPD:** o princípio de minimização de dados diz para coletar e reter só o necessário. Não tendo backend processando esses dados, não existe superfície de retenção indevida — não há o que vazar do nosso lado, porque não guardamos nada.

**Limitação aceita conscientemente:** como não há confirmação de entrega no nosso lado, não sabemos se o visitante realmente enviou a mensagem depois que a aba/app abriu (ele pode fechar sem mandar). Isso é aceitável para uma Fase 1 institucional; se uma fase futura precisar rastrear taxa de conversão de orçamentos, aí sim entra um backend com o cuidado redobrado de validação server-side descrito acima.

## SEO / Open Graph

Não é uma medida de segurança em si, mas cada página (`Home`, `Serviços`, `Orçamento`) tem `generateMetadata` próprio, traduzido por idioma, com `metadataBase` absoluto — evita o erro comum de Open Graph com URL relativa, que quebra silenciosamente em previews de link (WhatsApp, Slack, etc. não conseguem resolver uma URL relativa).
