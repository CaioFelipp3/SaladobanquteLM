/**
 * Dados de contato públicos da empresa — já exibidos abertamente no site,
 * por isso são constantes normais, não variáveis de ambiente/segredo.
 * Ver docs/05-seguranca.md — diferença entre "dado público" e "segredo real".
 */
export const contacts = {
  whatsappNumber: "5527993093644",
  instagramUrl: "https://www.instagram.com/saladobanquete.lm/",
  instagramHandle: "@saladobanquete.lm",
  email: "saladobanquete.lm@gmail.com",
  address: "R. Constante Sodré, 364 - Santa Lucia, Vitória, ES",
  mapsUrl:
    "https://maps.google.com/maps?q=R.+Constante+Sodré,+364,+Santa+Lucia,+Vitória,+ES",
} as const;

export function buildWhatsappUrl(message: string): string {
  return `https://wa.me/${contacts.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function buildMailtoUrl(subject: string, body: string): string {
  return `mailto:${contacts.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
