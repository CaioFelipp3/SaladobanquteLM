/**
 * Catálogo de ingressos vendidos pelo site — a ÚNICA fonte do preço.
 *
 * O navegador do comprador envia só QUAL ingresso e QUANTOS; o servidor busca
 * o preço aqui ao criar o pagamento no Mercado Pago. Assim ninguém consegue
 * pagar menos alterando a requisição (ver docs/05-seguranca.md).
 *
 * COMO ABRIR AS VENDAS DE UM EVENTO
 * 1. Atualize o card do evento em lib/i18n/messages/pt.json e en.json
 *    (Home.Events.chaDasFlores: título, data, descrição).
 * 2. Ajuste `eventName` abaixo para o mesmo nome do evento.
 * 3. Preencha `tickets` com os tipos de ingresso e preços. Exemplo:
 *      { id: "inteira", name: { pt: "Inteira", en: "Full price" }, price: 150 },
 *      { id: "meia", name: { pt: "Meia-entrada", en: "Half price" }, price: 75 },
 * 4. Confira se a variável MERCADO_PAGO_ACCESS_TOKEN está configurada na
 *    Vercel (ver .env.example) e faça um novo deploy.
 *
 * Com `tickets` vazio (ou sem o token), as vendas ficam desligadas e o botão
 * "Adquirir Ingresso" continua levando ao WhatsApp.
 */

export type Ticket = {
  /** Identificador sem espaços nem acentos — aparece no pedido do Mercado Pago. */
  id: string;
  /** Nome do tipo de ingresso em cada idioma do site. */
  name: { pt: string; en: string };
  /** Preço unitário em reais, ex.: 150 ou 87.5. */
  price: number;
};

export const ticketSales: {
  /** Nome do evento como aparece no checkout do Mercado Pago. */
  eventName: { pt: string; en: string };
  /** Máximo de ingressos numa mesma compra. */
  maxPerPurchase: number;
  /** Tipos de ingresso à venda. Vazio = vendas desligadas. */
  tickets: Ticket[];
} = {
  eventName: { pt: "Chá das Flores", en: "Chá das Flores" },
  maxPerPurchase: 10,
  tickets: [],
};
