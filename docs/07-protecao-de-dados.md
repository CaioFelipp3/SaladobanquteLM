# 07 — Proteção de dados pessoais (LGPD)

Este documento mapeia **quais dados pessoais o sistema trata, por onde passam, onde ficam, quem tem acesso e como são protegidos**, à luz da Lei Geral de Proteção de Dados (Lei nº 13.709/2018). O texto público para o visitante está na página [`/privacidade`](../app/[locale]/privacidade/page.tsx), com o conteúdo em `lib/i18n/messages/*.json` (chave `Privacy`).

> **Não é parecer jurídico.** É o levantamento técnico de como o site funciona. A política publicada deve ser revisada por um profissional de Direito antes do lançamento, e os pontos marcados como **pendente** dependem de decisão da Sala do Banquete.

## Papéis (vocabulário da LGPD)

| Papel | Quem é, neste caso |
|---|---|
| **Titular** | O visitante que pede orçamento (ou o comprador de ingresso, quando o backend entrar no ar) |
| **Controlador** | A Sala do Banquete – Liliam Müller: decide para que e como os dados são usados |
| **Operadores / terceiros** | Meta (WhatsApp), Google (Gmail), Vercel (hospedagem), Mercado Pago (pagamentos, só futuramente) |
| **Encarregado (DPO)** | Agentes de pequeno porte são dispensados de nomear um (Resolução CD/ANPD nº 2/2022), mas precisam oferecer um canal de contato: o e-mail `saladobanquete.lm@gmail.com`, indicado na política |

## Mapa de dados pessoais

### 1. Formulário de orçamento (`/orcamento`) — em produção

| Dado | Obrigatório? | Para quê |
|---|---|---|
| Nome | Sim | Saber com quem se está falando |
| Telefone | Sim | Retorno do contato; no envio por e-mail, é o canal alternativo de resposta |
| Tipo de serviço | Sim | Montar o orçamento |
| Data do evento | Sim | Verificar disponibilidade |
| Número de convidados | Sim | Dimensionar o orçamento |
| Mensagem | Não | Detalhes livres do pedido |
| Ciência da Política de Privacidade | Sim | Transparência (não é a base legal; ver abaixo) |

**Caminho que os dados percorrem:**

```
Navegador do visitante
  │  (1) validação e montagem da mensagem — tudo local, em JavaScript
  ▼
WhatsApp do visitante  ──ou──  App de e-mail do visitante
  │  (2) o visitante revisa e decide se envia
  ▼
WhatsApp da empresa (Meta)  ──ou──  Caixa do Gmail da empresa (Google)
  │  (3) a equipe lê e responde
  ▼
Dados ficam no histórico da conversa / caixa de entrada da empresa
```

**Onde os dados NÃO passam:** nenhum servidor da Sala do Banquete, nenhum banco de dados, nenhum log do site, nenhuma ferramenta de analytics. O site (Vercel) entrega só HTML/JS estático e nunca vê o conteúdo do formulário.

**Quem tem acesso:** quem opera o WhatsApp e o Gmail da empresa e, como operadores, a Meta e o Google, conforme as políticas deles.

### 2. Acesso ao site — em produção

| Dado | Quem coleta | Para quê |
|---|---|---|
| Endereço IP, navegador, URL acessada, data/hora | Vercel (logs de acesso da hospedagem) | Segurança e funcionamento; a Sala do Banquete não usa esses dados |
| Idioma escolhido (cookie `NEXT_LOCALE`) | O próprio site | Lembrar o idioma (pt/en). Cookie de sessão, `SameSite=Lax`, sem dado pessoal |

**O que o site não usa:** Google Analytics, Meta Pixel, Hotjar ou qualquer rastreador; cookies de publicidade; fontes ou scripts carregados de terceiros. As fontes são servidas pelo próprio domínio via `next/font`, e o IP do visitante não é enviado ao Google Fonts. A CSP (`docs/05-seguranca.md`) bloqueia scripts de outros domínios, então um rastreador não poderia ser adicionado por engano sem mudar a política.

### 3. Pagamentos (`backend/`) — **ainda não está no ar**

Quando o backend de ingressos for ativado, ele vai gravar, por transação: id do pagamento, status, e-mail e primeiro nome do pagador, valor e descrição do ingresso, em `backend/transacoes.json`.

| Medida | Status |
|---|---|
| Arquivo fora do git (`.gitignore`: `transacoes*.json`) | ✅ |
| Permissão `0600` (só o processo do servidor lê) | ✅ |
| Escrita atômica e quarentena de arquivo corrompido (sem perda nem sobrescrita) | ✅ |
| Endpoint de leitura (`GET /transacoes`) só com token de admin, comparado em tempo constante e com rate limit | ✅ |
| Logs sem e-mail nem nome | ✅ |
| Prazo de retenção e rotina de exclusão | ❌ **pendente**: o arquivo cresce sem limite de tempo, e os backups de rotação (`.bak`) também guardam PII |
| Criptografia em repouso | ❌ depende de onde for hospedado; um banco gerenciado resolveria |
| Atualizar a política de privacidade para incluir pagamentos e o Mercado Pago | ❌ **pendente**, obrigatório antes de ativar |

## Avaliação item a item

**Minimização (art. 6º, III).** O e-mail era coletado e depois **descartado**: não entrava na mensagem enviada. O campo foi removido. No WhatsApp, o número do remetente já identifica o cliente; no e-mail, o próprio remetente aparece. Os demais campos são necessários para um orçamento de evento. A mensagem é opcional.

**Finalidade (art. 6º, I).** Responder ao pedido de orçamento e, havendo contrato, organizar o evento. Está explícita na política e no aviso acima dos botões.

**Transparência (art. 6º, VI; art. 9º).** Não havia política de privacidade. Foi criada a página `/privacidade` (PT/EN), com link no rodapé de todas as páginas e no formulário.

**Base legal (art. 7º).** Art. 7º, V: *procedimentos preliminares relacionados a contrato, a pedido do titular*. O visitante procura a empresa para pedir orçamento. Por isso **consentimento não é a base legal**, e o checkbox do formulário é de **ciência** (o visitante declara ter lido a política), não de consentimento. A diferença importa: se fosse consentimento, a revogação obrigaria a parar o tratamento, o que não faz sentido no meio de uma negociação pedida pelo próprio cliente.

**Transmissão.** O site só é servido por HTTPS (HSTS de 2 anos). O formulário não transmite nada para nós; quem transmite é o WhatsApp (criptografia ponta a ponta) ou o provedor de e-mail do visitante. Acima dos botões, o aviso diz que **o envio sai do site** e que só o visitante decide se manda a mensagem.

**Armazenamento.** Nada é armazenado no site. Os dados ficam no WhatsApp e no Gmail da empresa (ver retenção).

**Retenção (art. 15 e 16).** **Pendente de validação:** a política publicada propõe 12 meses após o último contato quando não há contratação, e o prazo legal/fiscal quando há contrato. Para isso valer na prática, a equipe precisa de uma rotina, por exemplo uma revisão trimestral apagando conversas e e-mails de orçamentos antigos não fechados.

**Cookies e rastreamento.** Só o `NEXT_LOCALE`, que é funcional, de sessão e sem dado pessoal. Cookies estritamente necessários não exigem banner de consentimento. Se algum dia entrar analytics ou pixel, aí sim será preciso um banner com opção de recusar **antes** de carregar o script, além de atualizar a CSP e a política.

**Dados sensíveis (art. 5º, II; art. 11).** O formulário não pede nenhum. O campo livre "Mensagem" pode receber algo sensível por iniciativa do visitante (ex: restrição alimentar por motivo de saúde, religião num casamento). A política pede para não incluir esse tipo de informação, mas, se chegar, ela deve ser usada só para o evento e apagada junto com o resto.

**Direitos do titular (art. 18).** Listados na política, com o e-mail de contato e prazo de resposta proposto de 15 dias (**pendente de validação**; a LGPD fala em "prazo razoável", e o art. 19 prevê 15 dias para a declaração completa de acesso).

**Transferência internacional (art. 33).** WhatsApp, Gmail e Vercel podem armazenar dados fora do Brasil. A política informa isso.

## Medidas implementadas nesta auditoria

1. Remoção do campo e-mail (minimização).
2. Página `/privacidade` em PT/EN, com link no rodapé e no formulário.
3. Checkbox obrigatório de ciência da política antes do envio.
4. Aviso explícito de que o envio sai do site.
5. Validação que impede texto invisível ou de controle na mensagem (evita mensagens que enganem a equipe).
6. Backend: arquivo de PII com permissão restrita, fora do git, sem PII nos logs e sem envio de e-mail a um endereço fictício de terceiro (antes, sem e-mail do pagador, o sistema notificava `desconhecido@email.com`).

## Pendências para a Sala do Banquete

- [ ] Validar o prazo de retenção (12 meses) e o prazo de resposta (15 dias) da política.
- [ ] Criar a rotina de exclusão periódica de conversas e e-mails de orçamento antigos.
- [ ] Revisão jurídica do texto da política.
- [ ] Antes de ativar o backend de ingressos: definir a retenção de `transacoes.json`, atualizar a política (Mercado Pago, dados de pagamento) e preferir um banco de dados gerenciado com criptografia em repouso.
