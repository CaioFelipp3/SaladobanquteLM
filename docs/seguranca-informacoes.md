# Segurança de informações — segredos, variáveis e proteções do repositório

Guia prático: o que é segredo neste projeto, onde ele fica, como trocá-lo e
o que impede que ele vá parar no git. Complementa o
[05 — Segurança](./05-seguranca.md) (headers, CSP, formulários) e o
[07 — Proteção de dados](./07-protecao-de-dados.md) (LGPD). O relatório da
auditoria que gerou este guia (`docs/auditoria-protecao-dados.md`) é
**interno e fica fora do git**: ele lista fraquezas ainda não corrigidas, e
publicá-las num repositório público seria entregar um roteiro de ataque.

> **Regra que guia tudo aqui:** o repositório no GitHub é **público**. Tudo
> que for commitado — inclusive num commit antigo, apagado depois — deve ser
> tratado como publicado para sempre. Apagar o arquivo não "desvaza" nada.

## Inventário de variáveis de ambiente

| Variável | Para que serve | Pública ou secreta | Onde fica | Obrigatória |
|---|---|---|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | ID do Google Analytics 4 (`G-XXXXXXXXXX`). Com ela, o site mostra o banner de cookies e só carrega o GA depois do "Aceitar". Sem ela, nada do Google é carregado e a CSP bloqueia os domínios do Google. | **Pública** — o ID aparece no HTML de qualquer site com GA. O formato é validado em `lib/analytics/config.ts`. | Vercel → Settings → Environment Variables; localmente, `.env.local` | Não |
| `NODE_ENV` | Definida pelo próprio Next.js (`development`/`production`). Libera `'unsafe-eval'` na CSP só em desenvolvimento. | Não é configurada por nós | — | — |

**Por que tão poucas:** o site é estático (páginas geradas no build), não tem
banco de dados, não envia e-mail e não processa pagamento. Os formulários
montam um link `wa.me`/`mailto:` no próprio navegador. O e-book é vendido
numa plataforma externa. Não existe, hoje, nenhum segredo de servidor.

**Regra do prefixo `NEXT_PUBLIC_`:** toda variável com esse prefixo é
copiada para o JavaScript que vai ao navegador — qualquer visitante lê.
Nunca coloque segredo numa variável `NEXT_PUBLIC_`. Se um dia precisar de
uma chave de API, ela vai **sem** o prefixo e só pode ser lida em código de
servidor (Route Handler, Server Component, Server Action).

### Dados públicos que ficam no código (e não são segredo)

`lib/data/contacts.ts` guarda WhatsApp, e-mail, Instagram e endereço da Sala
do Banquete. São dados de contato **publicados de propósito** no site, por
isso são constantes normais, não variáveis de ambiente. Se algum contato
mudar, troque só nesse arquivo.

## Segredos existentes

**Nenhum, hoje.** O único segredo que o projeto já usou foi o
`MERCADO_PAGO_ACCESS_TOKEN` (checkout de ingressos, removido em
novembro/2026). A auditoria confirmou que ele **nunca foi commitado** — só o
placeholder do `.env.example`. Ver o que fazer com ele em
[Rotação de credenciais](#rotação-de-credenciais).

Contas que, mesmo sem aparecer no código, dão poder sobre o site e precisam
de senha forte + verificação em duas etapas:

| Conta | O que um invasor consegue fazer com ela |
|---|---|
| **GitHub** (dono do repositório) | Alterar o código que vai ao ar, apagar o histórico, ler/alterar configurações |
| **Vercel** | Publicar qualquer versão do site, ler e alterar variáveis de ambiente, mudar o domínio |
| **Registro do domínio** (`saladobanquetelm.com.br`, Registro.br) | Apontar o domínio para outro servidor |
| **Google Analytics** | Ler as métricas de visita |
| **Plataforma dos e-books** (quando houver) | Trocar o produto ou o recebedor das vendas |
| **Mercado Pago** (se a conta ainda existir) | Movimentar dinheiro com um access token |

## Rotação de credenciais

Rotacionar = criar uma credencial nova, colocar no lugar da antiga e
**revogar a antiga**. Faça isso sempre que uma credencial for commitada,
colada em chat/print/ticket, ou quando alguém com acesso sair do projeto.

### `MERCADO_PAGO_ACCESS_TOKEN` (checkout removido)

O checkout foi removido, então o token não deve mais existir em lugar
nenhum. Conferir:

1. Vercel → projeto → Settings → Environment Variables: se
   `MERCADO_PAGO_ACCESS_TOKEN` (ou `WEBHOOK_SECRET`, do backend antigo)
   ainda estiver lá, **apague**.
2. [Mercado Pago → Suas integrações](https://www.mercadopago.com.br/developers/panel/app)
   → a aplicação do site → Credenciais de produção → **Renovar** (gera um
   token novo e invalida o antigo). Se a aplicação não for mais usada,
   exclua-a.
3. Se o checkout voltar: gere o token no mesmo painel, cadastre na Vercel
   **sem** `NEXT_PUBLIC_`, marque como *Sensitive* e faça um novo deploy.

### `NEXT_PUBLIC_GA_MEASUREMENT_ID`

Não é segredo, não precisa rotacionar. Para trocar a propriedade do GA:
altere o valor na Vercel e faça **um novo deploy** (a variável é lida no
build).

### Tokens pessoais (GitHub, Vercel)

- GitHub → Settings → Developer settings → Personal access tokens: revogue
  os que não usa. O `gh` CLI deste computador usa um token próprio
  (`gh auth status` mostra; `gh auth refresh` renova).
- Vercel → Account Settings → Tokens: revogue os que não reconhece.

### Se um segredo for commitado (procedimento de incidente)

1. **Rotacione primeiro**, antes de qualquer limpeza: gere a credencial nova
   e revogue a antiga no painel do serviço. Esse é o único passo que
   realmente resolve.
2. Confira nos logs do serviço se a credencial foi usada por alguém.
3. Só depois, se quiser, remova do histórico (`git filter-repo`) e force o
   push — isso **não** desfaz cópias já feitas (forks, clones, caches,
   robôs que varrem o GitHub em segundos).
4. Registre o ocorrido no relatório de auditoria.

## O que nunca deve ser commitado

- `.env`, `.env.local`, `.env.production` e qualquer `.env.*` (exceto `.env.example`)
- Tokens, chaves de API, senhas — nem em comentário, nem em teste, nem "só por enquanto"
- Chaves e certificados: `.pem`, `.key`, `.crt`, `.p12`, `.pfx`, chaves SSH
- Exportações de planilha e bancos com dados de clientes: `.csv`, `.xlsx`, `.sql`, `.db`, dumps, backups
- Dados pessoais reais (nome, telefone, CPF, e-mail de cliente) em código, testes, exemplos ou documentação — use dados claramente fictícios (`(27) 99999-9999`, `Fulana de Tal`)
- Prints ou logs que mostrem algum dos itens acima
- A pasta `.vercel/` e `.claude/settings*.json` (configurações pessoais)
- Relatórios de auditoria ou pentest com fraquezas **ainda não corrigidas**
  (o `docs/auditoria-protecao-dados.md` já está no `.gitignore`). Depois de
  corrigido, o achado pode ir para o histórico público, como no
  [08 — Relatório da auditoria](./08-auditoria-seguranca.md)

O `.gitignore` já cobre todos esses tipos de arquivo, e o hook de
pre-commit barra os segredos que escaparem dentro de arquivos comuns.

## Como configurar o ambiente local com segurança

1. Clone o repositório **fora** de pastas sincronizadas (iCloud, Dropbox,
   OneDrive). A sincronização copia o `.env.local` e o `.git` para a nuvem
   e já causou corrupção do projeto antes.
2. Instale o gitleaks (binário, não vem pelo npm):
   `brew install gitleaks` (macOS) — outros sistemas:
   [instruções oficiais](https://github.com/gitleaks/gitleaks#installing).
3. `npm install` — instala as dependências **e ativa os hooks** do Husky
   (script `prepare`). Confira com `git config core.hooksPath`: deve mostrar
   `.husky/_`.
4. `cp .env.example .env.local` e preencha só o que precisar. O
   `.env.local` nunca entra no git.
5. `npm run dev`.

## Hooks de pre-commit

A cada `git commit`, o `.husky/pre-commit` roda, nesta ordem:

1. **`gitleaks git --staged`** — procura segredos só no que está em stage
   (o que vai entrar no commit). Mostra arquivo, linha e regra; o valor
   aparece como `REDACTED`. Regras: as ~200 padrão do gitleaks (AWS,
   GitHub, Google, Stripe, chaves privadas, tokens genéricos...) mais as do
   projeto em `.gitleaks.toml` — access token do Mercado Pago e CPF.
2. **`npm run lint`** — ESLint no projeto inteiro.

Se qualquer um falhar, o commit é cancelado e nada é gravado. Sem o gitleaks
instalado, o commit também é bloqueado (com a instrução de instalação), em
vez de passar sem verificação.

### Quando o gitleaks bloquear

- **É segredo de verdade:** tire do arquivo (vá para `.env.local`/Vercel),
  `git add` de novo e commite. Se ele já tinha sido colado em algum outro
  lugar, rotacione.
- **Falso positivo** (ex: um hash, um CPF fictício de exemplo): marque a
  linha com o comentário `gitleaks:allow`:
  ```ts
  const exemplo = "000.000.000-00"; // gitleaks:allow — CPF fictício (inválido)
  ```
  Para ignorar um achado específico sem mexer no código, rode
  `gitleaks git --staged -v .`, copie o `Fingerprint` e adicione-o a um
  arquivo `.gitleaksignore` na raiz.

### Pular o hook (`--no-verify`)

`git commit --no-verify` pula **todas** as verificações. Aceitável só quando:

- o lint falha por um problema que não é do seu commit e você está
  corrigindo uma emergência em produção — e o lint é resolvido logo em
  seguida; ou
- o gitleaks acusa um falso positivo que você já verificou linha a linha e
  não há tempo de marcar `gitleaks:allow`.

Nunca para "passar logo" um alerta de segredo que você não investigou. Para
pular só o lint mantendo o gitleaks, comente temporariamente a linha
`npm run lint --silent` no `.husky/pre-commit` (sem commitar a mudança).
Para desligar os hooks de vez numa máquina: `HUSKY=0 git commit ...`.

### Varredura do histórico inteiro

`npm run scan:secrets` roda o gitleaks em todos os commits de todos os
branches. Rode depois de mudar as regras do `.gitleaks.toml` ou ao receber
um repositório novo.

## Configuração do GitHub (fazer no site — não depende de arquivo)

O hook local pode ser pulado; as proteções abaixo rodam no servidor do
GitHub e não podem. Em repositório público, todas são gratuitas.
Caminho: repositório → **Settings → Advanced Security** (em contas antigas,
"Code security and analysis").

| Recurso | O que faz |
|---|---|
| **Secret Protection → Push protection** | Recusa o `git push` que contém um token reconhecido (GitHub, AWS, Google, Stripe e centenas de outros) |
| **Secret scanning** | Varre o repositório e o histórico e alerta segredos já publicados |
| **Dependabot alerts** | Avisa quando uma dependência tem vulnerabilidade conhecida |
| **Dependabot security updates** | Abre PR automático com a correção |
| **Dependabot version updates** | PRs semanais de atualização (`.github/dependabot.yml`, carência de 7 dias); vale a partir da `main` |
| **Branch protection na `main`** | Exige PR para alterar a `main`, bloqueia force push e exclusão |

Para conferir o estado atual pelo terminal:
`gh api repos/<dono>/<repositório> --jq .security_and_analysis`.

Para a `main`: Settings → Branches (ou Rules → Rulesets) → nova regra para
`main` com "Require a pull request before merging", "Block force pushes" e
"Restrict deletions".

### Política de versões novas

Atualizações de dependência esperam **pelo menos 7 dias** desde a
publicação (o Dependabot já aplica essa carência). Pacotes sequestrados
costumam ser detectados e retirados do npm nesse prazo. Exceção: correção de
vulnerabilidade crítica explorável no site — aí se avalia caso a caso,
conferindo a proveniência (`npm audit signatures`).
