import { z } from "zod";
import { ticketSales } from "@/lib/data/tickets";
import { routing } from "@/lib/i18n/routing";
import { createPreference, salesOpen } from "@/lib/payments/mercadopago";

// Pedido de compra = só o ingresso, a quantidade e o idioma. O preço NUNCA
// vem daqui: é buscado em lib/data/tickets.ts no servidor.
const checkoutSchema = z.object({
  ticketId: z.string().max(40),
  quantity: z.number().int().min(1).max(ticketSales.maxPerPurchase),
  locale: z.enum(routing.locales),
});

// Corpo esperado tem ~60 bytes; 1 KB já é folga de sobra.
const MAX_BODY_BYTES = 1024;

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false; // Origin "null" (iframe sandbox, arquivo local) e afins
  }
}

function error(code: string, status: number) {
  return Response.json({ error: code }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!salesOpen()) return error("sales_closed", 503);

  // Só aceita pedidos vindos do próprio site: o Origin que o navegador envia
  // (sempre presente em POST) precisa ter o mesmo host que ele está acessando.
  // Compara com o header Host (x-forwarded-host atrás do proxy da Vercel), e
  // não com request.url — no `next start` local ela sai como "localhost" mesmo
  // quando o acesso vem pelo IP da rede. Junto com a exigência de JSON, impede
  // que outro site dispare compras em nome do visitante (CSRF): um <form>
  // comum não envia JSON, e um fetch de outro site não consegue forjar Origin.
  if (!isSameOrigin(request)) return error("forbidden", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return error("unsupported_media_type", 415);
  }

  // Recusa pelo Content-Length antes de ler; confere de novo depois de ler
  // (o header pode faltar ou mentir).
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) {
    return error("payload_too_large", 413);
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return error("payload_too_large", 413);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return error("invalid_json", 400);
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) return error("invalid_request", 400);

  // find por igualdade estrita: "__proto__" e afins nunca casam com um id
  const ticket = ticketSales.tickets.find((item) => item.id === parsed.data.ticketId);
  if (!ticket) return error("invalid_request", 400);

  try {
    const url = await createPreference({
      ticket,
      quantity: parsed.data.quantity,
      locale: parsed.data.locale,
    });
    return Response.json({ url }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    // Detalhe só no log do servidor; o navegador recebe um código genérico.
    console.error("checkout:", err instanceof Error ? err.message : err);
    return error("payment_unavailable", 502);
  }
}
