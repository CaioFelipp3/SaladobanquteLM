import fs from "node:fs";
import path from "node:path";

const extensions = [".jpg", ".jpeg", ".png", ".webp"];

/**
 * Foto de cada item, se existir: basta salvar o arquivo em
 * public/images/<pasta>/ com o id do item como nome (ex: casamento.jpg).
 * Item sem foto continua com o "Imagem em breve".
 *
 * Roda só no servidor (lê o disco). Como as páginas são geradas no build
 * (SSG), uma foto nova só aparece em produção depois de um novo deploy; no
 * `npm run dev` aparece ao recarregar a página.
 */
export function findImages<Id extends string>(
  folder: string,
  ids: readonly Id[],
): Partial<Record<Id, string>> {
  const images: Partial<Record<Id, string>> = {};

  for (const id of ids) {
    const extension = extensions.find((ext) =>
      fs.existsSync(path.join(process.cwd(), "public", "images", folder, `${id}${ext}`)),
    );
    if (extension) images[id] = `/images/${folder}/${id}${extension}`;
  }

  return images;
}
