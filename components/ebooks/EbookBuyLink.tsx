"use client";

import { trackEvent } from "@/lib/analytics/gtag";
import type { EbookId } from "@/lib/data/ebooks";
import { buttonPrimary } from "@/lib/ui/styles";

// Client Component só para registrar o clique no GA antes de sair para a
// plataforma de vendas. O link abre em nova aba, então o evento tem tempo de
// ser enviado. Nenhum dado pessoal vai junto — só qual e-book.
export default function EbookBuyLink({
  id,
  href,
  label,
  newTabLabel,
}: {
  id: EbookId;
  href: string;
  label: string;
  newTabLabel: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent("begin_checkout", { items: [{ item_id: id }] })}
      className={`${buttonPrimary} w-full`}
    >
      {label}
      <span className="sr-only"> {newTabLabel}</span>
    </a>
  );
}
