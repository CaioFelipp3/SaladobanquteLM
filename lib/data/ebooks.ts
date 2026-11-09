/**
 * E-books à venda. Título e descrição ficam nos dicionários de tradução
 * (lib/i18n/messages/*.json, chave Ebooks.items.<id>); a capa, em
 * public/images/ebooks/<id>.jpg.
 *
 * `url` é o link de compra na plataforma de vendas (Hotmart, Kiwify...).
 * Enquanto estiver vazio, o card mostra "Em breve" no lugar do botão.
 * Só links https: o botão abre o endereço numa nova aba.
 */
export const ebooks = [
  { id: "ebook-1", url: "" },
  { id: "ebook-2", url: "" },
] as const satisfies readonly { id: string; url: "" | `https://${string}` }[];

export type EbookId = (typeof ebooks)[number]["id"];
