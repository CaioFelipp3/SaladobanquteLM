# 09 — Venda de ingressos (self-checkout com Mercado Pago)

O site vende ingressos pelo **Checkout Pro do Mercado Pago**: o comprador escolhe tipo e quantidade num popup, paga no ambiente do Mercado Pago (Pix, cartão ou boleto) e volta para uma página de confirmação. Hoje as vendas estão **desligadas**: o catálogo está vazio, então o botão "Adquirir Ingresso" leva ao WhatsApp, como antes.

## Como ligar as vendas de um evento

1. **Credenciais do Mercado Pago.** No [painel de desenvolvedores](https://www.mercadopago.com.br/developers/panel/app), crie uma aplicação do tipo *Checkout Pro* na conta da Sala do Banquete e copie o **Access Token de produção** (começa com `APP_USR-`).
2. **Cadastre o token na Vercel.** Em *Settings → Environment Variables*, crie `MERCADO_PAGO_ACCESS_TOKEN` com o token, marcado para *Production* (e *Preview*, se quiser testar lá). Nunca coloque o token no código nem com o prefixo `NEXT_PUBLIC_`.
3. **Preencha o catálogo** em [`lib/data/tickets.ts`](../lib/data/tickets.ts):
   ```ts
   eventName: { pt: "Chá das Flores", en: "Chá das Flores" },
   maxPerPurchase: 10,
   tickets: [
     { id: "inteira", name: { pt: "Inteira", en: "Full price" }, price: 150 },
     { id: "meia", name: { pt: "Meia-entrada", en: "Half price" }, price: 75 },
   ],
   ```
   - `id`: sem espaços nem acentos. É o que aparece no pedido do Mercado Pago.
   - `price`: em reais, com ponto para os centavos (`87.5` = R$ 87,50).
4. **Atualize o card do evento** (título, data, descrição) em `lib/i18n/messages/pt.json` e `en.json`, bloco `Home.Events.chaDasFlores`.
5. **Faça o deploy.** O botão do card passa a abrir o popup de compra.

As vendas só abrem quando **as duas coisas** existem: ingressos no catálogo **e** o token configurado. Para encerrar as vendas depois do evento, volte `tickets` para `[]` e faça o deploy.

## Como testar sem cobrar de verdade

O Mercado Pago tem um ambiente de testes:

1. No painel, gere as **credenciais de teste** da aplicação. O Access Token de teste começa com `TEST-`.
2. Localmente, crie `.env.local` (já ignorado pelo git) com `MERCADO_PAGO_ACCESS_TOKEN=TEST-...` e preencha o catálogo.
3. Rode `npm run build && npm start`. Com um token `TEST-`, o site manda o comprador para o checkout de **sandbox**.
4. Pague com os **cartões de teste** da documentação do Mercado Pago (seção de testes do Checkout Pro). O nome do titular define o resultado (`APRO` aprova, `OTHE` recusa etc.).

**Limitação do teste local:** o Mercado Pago não aceita `localhost` como endereço de retorno. Depois de pagar, ele devolve o comprador para o domínio público (`www.saladobanquetelm.com.br`), não para o seu computador. Para testar o ciclo completo, use um **Preview da Vercel** com o token de teste: nos Previews, o retorno vai automaticamente para a URL do próprio Preview.

## O fluxo, passo a passo

```
Card do evento → popup (tipo + quantidade + total)
  → POST /api/checkout { ticketId, quantity, locale }
      servidor: valida, busca o PREÇO no catálogo, cria a "preferência" no Mercado Pago
  ← { url } (link do checkout do Mercado Pago)
  → comprador paga no Mercado Pago
  → Mercado Pago devolve para /ingressos/retorno?payment_id=...&external_reference=...
      servidor: consulta o pagamento na API do Mercado Pago e mostra aprovado / pendente / recusado
```

| Arquivo | Papel |
|---|---|
| [`lib/data/tickets.ts`](../lib/data/tickets.ts) | Catálogo: tipos de ingresso e preços (única fonte do preço) |
| [`lib/payments/mercadopago.ts`](../lib/payments/mercadopago.ts) | Conversa com a API do Mercado Pago (só no servidor) |
| [`app/api/checkout/route.ts`](../app/api/checkout/route.ts) | Recebe o pedido do popup e devolve o link de pagamento |
| [`components/home/TicketCheckout.tsx`](../components/home/TicketCheckout.tsx) | Botão + popup de compra |
| [`app/[locale]/ingressos/retorno/page.tsx`](../app/[locale]/ingressos/retorno/page.tsx) | Página de chegada depois do pagamento |

## Onde ficam as vendas

**No painel do Mercado Pago**, não no site. Lá aparece cada pagamento com nome e e-mail de quem comprou, tipo e quantidade de ingresso, valor e status, e dá para exportar a lista de convidados. O Mercado Pago também manda o comprovante ao comprador e notifica a conta a cada venda.

O site **não grava nenhum dado pessoal**: não tem banco de dados, não recebe dados de cartão e não envia e-mails. Isso simplifica a manutenção e a LGPD (ver [`07-protecao-de-dados.md`](./07-protecao-de-dados.md)).

**O que fica de fora:** não há controle automático de lotação. Se o evento tem limite de vagas, acompanhe as vendas no painel e encerre (catálogo vazio + deploy) quando lotar. Se isso virar problema, o próximo passo é um banco de dados com contagem de ingressos e webhook do Mercado Pago.

## Segurança

Resumo do que protege o checkout (detalhes em [`05-seguranca.md`](./05-seguranca.md)):

- **O preço nunca vem do navegador.** O popup envia só o *id* do ingresso e a quantidade; o servidor busca o preço no catálogo. Testado: um pedido com `price: 0.01` é ignorado e o Mercado Pago recebe o preço do catálogo.
- **O token fica só no servidor.** `lib/payments/mercadopago.ts` começa com `import "server-only"`: se for importado por um componente do navegador, o build falha.
- **CSRF:** a API só aceita pedidos JSON vindos do próprio site (o `Origin` precisa bater com o host).
- **A página de retorno não acredita na URL.** Qualquer pessoa pode digitar `?status=approved`; o status exibido vem da consulta à API do Mercado Pago.
- **IDOR:** a página de retorno só mostra um pagamento se o `external_reference` (um UUID aleatório gerado em cada pedido) bater. Trocar o número do pagamento na URL não revela compras de outras pessoas.
- **Nenhum dado do comprador é exibido** na página de retorno: só o status, a descrição e o valor.
