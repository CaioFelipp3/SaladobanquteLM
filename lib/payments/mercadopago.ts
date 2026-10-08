import "server-only";
import { ticketSales, type Ticket } from "@/lib/data/tickets";
import { routing } from "@/lib/i18n/routing";
import { siteUrl } from "@/lib/seo/metadata";

/**
 * Integração com o Checkout Pro do Mercado Pago, só no servidor.
 * `import "server-only"`: se este arquivo for importado por um Client
 * Component, o build falha — o token de acesso nunca chega ao navegador.
 *
 * Os registros de venda (comprador, valor, status) ficam no painel do
 * Mercado Pago; o site não grava nenhum dado pessoal.
 */

// Endereço da API. A troca só é aceita fora da Vercel, para os testes
// automatizados apontarem para um servidor falso — em produção é sempre o real.
const API_URL =
  (!process.env.VERCEL && process.env.MERCADO_PAGO_API_URL) || "https://api.mercadopago.com";

const TIMEOUT_MS = 10_000;

function accessToken(): string | undefined {
  return process.env.MERCADO_PAGO_ACCESS_TOKEN || undefined;
}

/** Vendas abertas = há ingressos no catálogo E o token está configurado. */
export function salesOpen(): boolean {
  return ticketSales.tickets.length > 0 && Boolean(accessToken());
}

/**
 * Endereço público para onde o Mercado Pago devolve o comprador.
 * Não usa o header Host da requisição (que pode ser forjado) e nunca é
 * localhost — o Mercado Pago recusa domínios locais nas URLs de retorno.
 * Em Preview na Vercel, volta para a própria URL do Preview.
 */
function publicBaseUrl(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return siteUrl;
}

export async function createPreference({
  ticket,
  quantity,
  locale,
}: {
  ticket: Ticket;
  quantity: number;
  locale: (typeof routing.locales)[number];
}): Promise<string> {
  const token = accessToken();
  if (!token) throw new Error("MERCADO_PAGO_ACCESS_TOKEN ausente");

  const returnUrl = `${publicBaseUrl()}${locale === routing.defaultLocale ? "" : `/${locale}`}/ingressos/retorno`;

  const response = await fetch(`${API_URL}/checkout/preferences`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
    body: JSON.stringify({
      items: [
        {
          id: ticket.id,
          title: `${ticketSales.eventName[locale]} — ${ticket.name[locale]}`,
          quantity,
          unit_price: ticket.price,
          currency_id: "BRL",
        },
      ],
      back_urls: { success: returnUrl, failure: returnUrl, pending: returnUrl },
      auto_return: "approved",
      // Identificador do pedido no nosso lado (aparece no painel do MP)
      external_reference: crypto.randomUUID(),
      // Como a compra aparece na fatura do cartão
      statement_descriptor: "SALA DO BANQUETE",
    }),
  });

  if (!response.ok) {
    throw new Error(`Mercado Pago respondeu ${response.status} ao criar a preferência`);
  }

  const data = (await response.json()) as { init_point?: string; sandbox_init_point?: string };
  // Credenciais de teste (TEST-...) usam o ambiente sandbox do checkout
  const url = token.startsWith("TEST-") ? (data.sandbox_init_point ?? data.init_point) : data.init_point;
  if (!url) throw new Error("Mercado Pago não devolveu o link de pagamento");
  return url;
}

export type PaymentSummary = {
  status: string;
  amount: number;
  description: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Consulta um pagamento direto na API. A página de retorno usa isto em vez de
 * confiar no `?status=approved` da URL, que qualquer um pode digitar.
 *
 * Exige também o `external_reference` (UUID aleatório gerado na criação do
 * pedido e devolvido pelo Mercado Pago na URL de retorno). Sem isso, qualquer
 * pessoa poderia trocar o payment_id na URL e ver status e valor das compras
 * de outras pessoas (IDOR).
 */
export async function getPayment(
  paymentId: string,
  externalReference: string,
): Promise<PaymentSummary | null> {
  const token = accessToken();
  if (!token || !/^\d{1,20}$/.test(paymentId) || !UUID.test(externalReference)) return null;

  try {
    const response = await fetch(`${API_URL}/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      status?: string;
      transaction_amount?: number;
      description?: string;
      external_reference?: string;
    };
    if (data.external_reference !== externalReference) return null;
    return {
      status: data.status ?? "unknown",
      amount: data.transaction_amount ?? 0,
      description: data.description ?? "",
    };
  } catch {
    return null;
  }
}
