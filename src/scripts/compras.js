// compras.js — Links de ingressos via Mercado Pago

// Configurações dos links de ingresso
const TICKET_LINKS = {
  ingresso1: "", // Cole aqui o link do Mercado Pago para o Ingresso 1
  ingresso2: "", // Cole aqui o link do Mercado Pago para o Ingresso 2
};

/**
 * Define o link de um ingresso se válido
 */
function setTicketLink(ticketId, url) {
  const element = document.getElementById(`link-${ticketId}`);
  if (element && url.startsWith("https://")) {
    element.setAttribute("href", url);
  }
}

// Inicialização dos links
Object.entries(TICKET_LINKS).forEach(([id, url]) => {
  setTicketLink(id, url);
});
