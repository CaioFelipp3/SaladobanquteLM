# 07 — Proteção de dados pessoais (LGPD)

Este documento mapeia **quais dados pessoais o sistema trata, por onde passam, onde ficam, quem tem acesso e como são protegidos**, à luz da Lei Geral de Proteção de Dados (Lei nº 13.709/2018). O texto público para o visitante está na página [`/privacidade`](../app/[locale]/privacidade/page.tsx), com o conteúdo em `lib/i18n/messages/*.json` (chave `Privacy`).

> **Não é parecer jurídico.** É o levantamento técnico de como o site funciona. A política publicada deve ser revisada por um profissional de Direito antes do lançamento, e os pontos marcados como **pendente** dependem de decisão da Sala do Banquete.

## Papéis (vocabulário da LGPD)

| Papel | Quem é, neste caso |
|---|---|
| **Titular** | O visitante que pede orçamento, demonstra interesse numa aula ou compra um e-book |
| **Controlador** | A Sala do Banquete – Liliam Müller: decide para que e como os dados são usados |
| **Operadores / terceiros** | Meta (WhatsApp), Google (Gmail e Google Analytics), Vercel (hospedagem), plataforma de vendas dos e-books |
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

**Onde os dados NÃO passam:** nenhum servidor da Sala do Banquete, nenhum banco de dados, nenhum log do site. O Google Analytics registra só que um orçamento foi enviado (canal e tipo de serviço), nunca o conteúdo dos campos. O site (Vercel) entrega só HTML/JS estático e nunca vê o conteúdo do formulário.

**Quem tem acesso:** quem opera o WhatsApp e o Gmail da empresa e, como operadores, a Meta e o Google, conforme as políticas deles.

### 2. Acesso ao site — em produção

| Dado | Quem coleta | Para quê |
|---|---|---|
| Endereço IP, navegador, URL acessada, data/hora | Vercel (logs de acesso da hospedagem) | Segurança e funcionamento; a Sala do Banquete não usa esses dados |
| Idioma escolhido (cookie `NEXT_LOCALE`) | O próprio site | Lembrar o idioma (pt/en). Cookie de sessão, `SameSite=Lax`, sem dado pessoal. Só é gravado quando o idioma escolhido é diferente do idioma do navegador: quem navega em português com o navegador em português não recebe cookie nenhum (conferido em 11/11/2026) |
| Escolha sobre cookies (`cookie-consent`, localStorage) | O próprio site | Lembrar se o visitante aceitou ou recusou a análise, por 12 meses |
| Páginas vistas, origem do acesso, dispositivo, cidade aproximada, eventos (orçamento ou interesse em aula enviado, clique para comprar e-book) — cookies `_ga` e `_ga_<ID>` | Google Analytics 4, **só com consentimento** | Estatísticas de uso do site |

**Google Analytics** (detalhes técnicos em [`10-analytics-e-cookies.md`](./10-analytics-e-cookies.md)): só carrega depois do clique em "Aceitar" no banner. Antes disso, nenhum script ou requisição vai para o Google. Os recursos de publicidade ficam desligados (Consent Mode com `ad_storage` negado, Google Signals e personalização de anúncios desativados), e o GA4 não guarda o IP. Os cookies expiram em 12 meses, junto com a escolha do banner.

**O que o site não usa:** Meta Pixel, Hotjar ou outro rastreador além do Google Analytics; cookies de publicidade; fontes carregadas de terceiros. As fontes são servidas pelo próprio domínio via `next/font`, e o IP do visitante não é enviado ao Google Fonts. A CSP (`docs/05-seguranca.md`) só libera os domínios do Google Analytics quando o ID de medição está configurado; qualquer outro rastreador continua bloqueado e não poderia ser adicionado por engano sem mudar a política.

### 3. Formulário de interesse em aulas (`/aulas`)

Mesmo caminho do orçamento (seção 1): o navegador monta a mensagem e abre o WhatsApp ou o e-mail do visitante; nada passa por servidor nosso. As regras de validação são as mesmas (`lib/validation/common.ts`).

| Dado | Obrigatório? | Para quê |
|---|---|---|
| Nome | Sim | Saber com quem se está falando |
| Telefone | Sim | Retorno com datas e valores |
| Aula de interesse | Sim | Saber qual turma oferecer |
| Mensagem | Não | Dúvidas livres |
| Ciência da Política de Privacidade | Sim | Transparência |

O Google Analytics registra só que um interesse foi enviado (canal e aula), nunca o conteúdo dos campos.

### 4. Compra de e-books (plataforma externa)

O comprador sai do site pelo link de compra e informa nome, e-mail, documento e dados de pagamento **na plataforma de vendas**, nunca no site. A plataforma repassa à Sala do Banquete os dados da compra necessários para entrega e atendimento, conforme o contrato e a política dela. O Google Analytics registra só o clique no botão de compra (qual e-book).

| Medida | Status |
|---|---|
| Site não recebe nem grava dados de pagamento, documento ou contato do comprador | ✅ |
| Política de privacidade com a seção "Compra de e-books" (finalidade, base legal, compartilhamento e retenção) | ✅ |
| Nomear a plataforma na política assim que for escolhida (hoje o texto diz "plataforma externa de vendas") | ❗ **pendente** |

## Avaliação item a item

**Minimização (art. 6º, III).** O e-mail era coletado e depois **descartado**: não entrava na mensagem enviada. O campo foi removido. No WhatsApp, o número do remetente já identifica o cliente; no e-mail, o próprio remetente aparece. Os demais campos são necessários para um orçamento de evento. A mensagem é opcional.

**Finalidade (art. 6º, I).** Responder ao pedido de orçamento e, havendo contrato, organizar o evento. Está explícita na política e no aviso acima dos botões.

**Transparência (art. 6º, VI; art. 9º).** Não havia política de privacidade. Foi criada a página `/privacidade` (PT/EN), com link no rodapé de todas as páginas e no formulário.

**Base legal (art. 7º).** Art. 7º, V: *procedimentos preliminares relacionados a contrato, a pedido do titular*. O visitante procura a empresa para pedir orçamento. Por isso **consentimento não é a base legal**, e o checkbox do formulário é de **ciência** (o visitante declara ter lido a política), não de consentimento. A diferença importa: se fosse consentimento, a revogação obrigaria a parar o tratamento, o que não faz sentido no meio de uma negociação pedida pelo próprio cliente.

**Transmissão.** O site só é servido por HTTPS (HSTS de 2 anos). O formulário não transmite nada para nós; quem transmite é o WhatsApp (criptografia ponta a ponta) ou o provedor de e-mail do visitante. Acima dos botões, o aviso diz que **o envio sai do site** e que só o visitante decide se manda a mensagem.

**Armazenamento.** Nada é armazenado no site. Os dados ficam no WhatsApp e no Gmail da empresa (ver retenção).

**Retenção (art. 15 e 16).** **Pendente de validação:** a política publicada propõe 12 meses após o último contato quando não há contratação, e o prazo legal/fiscal quando há contrato. Para isso valer na prática, a equipe precisa de uma rotina, por exemplo uma revisão trimestral apagando conversas e e-mails de orçamentos antigos não fechados.

**Cookies e rastreamento.** `NEXT_LOCALE` e o registro da escolha do banner são estritamente necessários e não exigem consentimento. Os cookies do Google Analytics têm base no **consentimento** (art. 7º, I): o banner tem "Aceitar" e "Recusar" com o mesmo peso, nada carrega antes da escolha, e o link "Preferências de cookies" no rodapé permite revogar a qualquer momento (art. 8º, § 5º), apagando os cookies `_ga`. Segue o Guia orientativo de cookies da ANPD (2022).

**Dados sensíveis (art. 5º, II; art. 11).** O formulário não pede nenhum. O campo livre "Mensagem" pode receber algo sensível por iniciativa do visitante (ex: restrição alimentar por motivo de saúde, religião num casamento). A política pede para não incluir esse tipo de informação, mas, se chegar, ela deve ser usada só para o evento e apagada junto com o resto.

**Direitos do titular (art. 18).** Listados na política, com o e-mail de contato e prazo de resposta proposto de 15 dias (**pendente de validação**; a LGPD fala em "prazo razoável", e o art. 19 prevê 15 dias para a declaração completa de acesso).

**Transferência internacional (art. 33).** WhatsApp, Gmail e Vercel podem armazenar dados fora do Brasil. A política informa isso.

## Medidas implementadas nesta auditoria

1. Remoção do campo e-mail (minimização).
2. Página `/privacidade` em PT/EN, com link no rodapé e no formulário.
3. Checkbox obrigatório de ciência da política antes do envio.
4. Aviso explícito de que o envio sai do site.
5. Validação que impede texto invisível ou de controle na mensagem (evita mensagens que enganem a equipe).
6. Venda de e-books por plataforma externa, sem dados do comprador no site (a venda de ingressos com Mercado Pago foi removida em novembro de 2026).
7. Google Analytics só com consentimento, banner com recusa tão fácil quanto aceite, revogação pelo rodapé e política atualizada (seção Cookies).

## Pendências para a Sala do Banquete

- [ ] Validar o prazo de retenção (12 meses) e o prazo de resposta (15 dias) da política.
- [ ] Criar a rotina de exclusão periódica de conversas e e-mails de orçamento antigos.
- [ ] Revisão jurídica do texto da política (incluindo a seção de cookies/Google Analytics).
- [ ] Na propriedade do GA4: manter a retenção de dados em **2 meses** (padrão) e deixar o **Google Signals desativado**, como a política informa.
- [ ] E-books: nomear a plataforma de vendas na política (seção "Compra de e-books") e conferir que dados ela repassa ao produtor.
- [ ] Se houver listas de convidados antigas exportadas do Mercado Pago (vendas de ingressos já encerradas), apagá-las, salvo obrigação fiscal.
