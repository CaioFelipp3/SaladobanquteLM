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
  // Mesmo endereço em partes, para os dados estruturados do Google (JSON-LD)
  addressParts: {
    street: "R. Constante Sodré, 364",
    neighborhood: "Santa Lúcia",
    city: "Vitória",
    state: "ES",
    country: "BR",
  },
  phoneDisplay: "+55 27 99309-3644",
  mapsUrl:
    "https://maps.google.com/maps?q=R.+Constante+Sodr%C3%A9,+364,+Santa+Lucia,+Vit%C3%B3ria,+ES",
} as const;

/**
 * Link wa.me para o número da empresa. A mensagem passa por
 * encodeURIComponent: qualquer &, #, ? ou quebra de linha digitada pelo
 * visitante vira texto literal, sem como injetar parâmetros extras na URL.
 */
export function buildWhatsappUrl(message?: string): string {
  const base = `https://wa.me/${contacts.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function buildMailtoUrl(subject: string, body: string): string {
  return `mailto:${contacts.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
