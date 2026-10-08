import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { buildWhatsappUrl } from "@/lib/data/contacts";
import { Link } from "@/lib/i18n/navigation";
import { getPayment } from "@/lib/payments/mercadopago";
import { buttonPrimary, pageHeading } from "@/lib/ui/styles";

// Página de chegada depois do Mercado Pago. É pessoal de cada comprador:
// fica fora dos buscadores e do sitemap.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Tickets.Return.Metadata" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

type Outcome = "approved" | "pending" | "rejected" | "unknown";

// Status da API do Mercado Pago → mensagem que mostramos
function outcomeOf(status: string | undefined): Outcome {
  if (status === "approved") return "approved";
  if (status === "pending" || status === "in_process" || status === "authorized") return "pending";
  if (status === "rejected" || status === "cancelled") return "rejected";
  return "unknown";
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export default async function RetornoPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Tickets.Return");
  const format = await getFormatter();

  // O Mercado Pago acrescenta payment_id, status, external_reference... à URL.
  // O status da URL é ignorado: qualquer um pode digitar ?status=approved.
  // O que vale é a consulta à API (que também confere o external_reference).
  const query = await searchParams;
  // Só dígitos: o id também entra na mensagem de ajuda do WhatsApp, e um
  // texto arbitrário na URL viraria uma mensagem pronta forjada.
  const paymentId = /^\d{1,20}$/.test(first(query.payment_id)) ? first(query.payment_id) : "";
  const payment = await getPayment(paymentId, first(query.external_reference));
  const outcome = outcomeOf(payment?.status);

  return (
    <section className="mx-auto max-w-[640px] px-5 py-16 text-center">
      <h1 className={pageHeading}>{t(`${outcome}Title`)}</h1>
      <p className="mb-6 text-[15px] leading-relaxed xs:text-base">{t(`${outcome}Body`)}</p>

      {payment && (
        <div className="mx-auto mb-8 max-w-[420px] rounded-[10px] border border-banquete-border bg-white px-5 py-4 text-sm">
          <p className="font-semibold">
            {t("summary", {
              description: payment.description,
              amount: format.number(payment.amount, { style: "currency", currency: "BRL" }),
            })}
          </p>
          <p className="mt-1 text-banquete-dark/70">
            {t("orderLabel")} {paymentId}
          </p>
        </div>
      )}

      <div className="flex flex-col items-center justify-center gap-3 xs:flex-row">
        <Link href={outcome === "rejected" ? "/#eventos" : "/"} className={buttonPrimary}>
          {outcome === "rejected" ? t("tryAgain") : t("backHome")}
        </Link>
        <a
          href={buildWhatsappUrl(t("helpMessage", { order: paymentId || "—" }))}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-banquete-rose underline underline-offset-2"
        >
          {t("help")}
        </a>
      </div>
    </section>
  );
}
