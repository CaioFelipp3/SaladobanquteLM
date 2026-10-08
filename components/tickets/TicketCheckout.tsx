"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import type { Ticket } from "@/lib/data/tickets";
import { Link } from "@/lib/i18n/navigation";
import { buttonPrimary, focusRing } from "@/lib/ui/styles";

type Status = { kind: "idle" } | { kind: "submitting" } | { kind: "error" };

// O link de pagamento só pode levar ao Mercado Pago. Se a resposta da nossa
// API apontar para qualquer outro lugar, o navegador não segue (defesa contra
// redirecionamento aberto caso algo no caminho seja comprometido).
function isMercadoPagoUrl(value: string): boolean {
  try {
    const { protocol, hostname } = new URL(value);
    return protocol === "https:" && /(^|\.)mercadopago\.com(\.br)?$/.test(hostname);
  } catch {
    return false;
  }
}

/**
 * Botão "Adquirir Ingresso" + popup de compra. O popup escolhe tipo e
 * quantidade, pede ao nosso servidor (/api/checkout) um link de pagamento e
 * leva o comprador ao Mercado Pago. Nome, CPF e cartão são informados só lá.
 */
export default function TicketCheckout({
  eventName,
  tickets,
  maxPerPurchase,
  buttonLabel,
  whatsappHref,
}: {
  eventName: string;
  tickets: Ticket[];
  maxPerPurchase: number;
  buttonLabel: string;
  whatsappHref: string;
}) {
  const t = useTranslations("Tickets");
  const locale = useLocale() as "pt" | "en";
  const format = useFormatter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [ticketId, setTicketId] = useState(tickets[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const ticket = tickets.find((item) => item.id === ticketId) ?? tickets[0];
  const money = (value: number) => format.number(value, { style: "currency", currency: "BRL" });
  const clamp = (value: number) => Math.min(maxPerPurchase, Math.max(1, Math.trunc(value) || 1));

  async function goToPayment() {
    setStatus({ kind: "submitting" });
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: ticket.id, quantity, locale }),
      });
      const data = (await response.json()) as { url?: string };
      if (!response.ok || !data.url || !isMercadoPagoUrl(data.url)) throw new Error("checkout");
      window.location.assign(data.url);
      // Mantém "Abrindo o Mercado Pago..." até a página trocar
    } catch {
      setStatus({ kind: "error" });
    }
  }

  const fieldsetLegend = "mb-2 block text-[13px] font-semibold";

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => {
          setStatus({ kind: "idle" });
          dialogRef.current?.showModal();
        }}
        className={`${buttonPrimary} mt-auto text-center`}
      >
        {buttonLabel}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="ticket-dialog-title"
        onClick={(event) => {
          if (event.target === event.currentTarget && status.kind !== "submitting") {
            event.currentTarget.close();
          }
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-[440px] rounded-[10px] bg-banquete-bg p-0 text-banquete-dark shadow-xl backdrop:bg-banquete-dark/60"
      >
        <form
          className="relative px-6 pb-6 pt-8"
          onSubmit={(event) => {
            event.preventDefault();
            if (status.kind !== "submitting") void goToPayment();
          }}
        >
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label={t("close")}
            className={`absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-2xl leading-none text-banquete-dark/70 transition-colors hover:bg-banquete-rose-soft hover:text-banquete-dark ${focusRing}`}
          >
            <span aria-hidden="true">×</span>
          </button>

          <h2 id="ticket-dialog-title" className="mb-5 text-center font-serif text-2xl leading-snug">
            <span className="block font-sans text-xs font-semibold uppercase tracking-wide text-banquete-dark/70">
              {t("dialogLabel")}
            </span>
            {eventName}
          </h2>

          <fieldset className="mb-5">
            <legend className={fieldsetLegend}>{t("ticketType")}</legend>
            <div className="flex flex-col gap-2">
              {tickets.map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-banquete-input-border bg-white px-4 py-3 text-sm has-[:checked]:border-banquete-rose has-[:checked]:ring-1 has-[:checked]:ring-banquete-rose"
                >
                  <span className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="ticket"
                      value={item.id}
                      checked={item.id === ticket.id}
                      onChange={() => setTicketId(item.id)}
                      className="h-4 w-4 accent-banquete-rose"
                    />
                    {item.name[locale]}
                  </span>
                  <span className="font-semibold">{money(item.price)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mb-5">
            <legend className={fieldsetLegend}>{t("quantity")}</legend>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={t("decrease")}
                disabled={quantity <= 1}
                onClick={() => setQuantity((value) => clamp(value - 1))}
                className={`flex h-11 w-11 items-center justify-center rounded-md border border-banquete-input-border bg-white text-xl disabled:opacity-40 ${focusRing}`}
              >
                −
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={maxPerPurchase}
                value={quantity}
                aria-label={t("quantity")}
                onChange={(event) => setQuantity(clamp(Number(event.target.value)))}
                className={`h-11 w-16 rounded-md border border-banquete-input-border bg-white text-center text-[15px] ${focusRing}`}
              />
              <button
                type="button"
                aria-label={t("increase")}
                disabled={quantity >= maxPerPurchase}
                onClick={() => setQuantity((value) => clamp(value + 1))}
                className={`flex h-11 w-11 items-center justify-center rounded-md border border-banquete-input-border bg-white text-xl disabled:opacity-40 ${focusRing}`}
              >
                +
              </button>
            </div>
          </fieldset>

          <p className="mb-4 flex items-baseline justify-between border-t border-banquete-border pt-4">
            <span className="text-sm font-semibold">{t("total")}</span>
            <span className="text-xl font-semibold" aria-live="polite">
              {money(ticket.price * quantity)}
            </span>
          </p>

          <p className="mb-5 text-xs leading-relaxed text-banquete-dark/70">
            {t("paymentNote")}{" "}
            <Link
              href="/privacidade"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-banquete-rose underline underline-offset-2"
            >
              {t("privacyLink")}
            </Link>
          </p>

          {status.kind === "error" && (
            <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <strong>{t("errorTitle")}</strong>{" "}
              {t.rich("errorBody", {
                link: (chunks) => (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline underline-offset-2"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </p>
          )}

          <button
            type="submit"
            disabled={status.kind === "submitting"}
            className={`${buttonPrimary} w-full text-center disabled:cursor-wait disabled:opacity-70`}
          >
            {status.kind === "submitting" ? t("submitting") : t("submit")}
          </button>
        </form>
      </dialog>
    </>
  );
}
