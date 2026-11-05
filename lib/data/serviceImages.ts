import fs from "node:fs";
import path from "node:path";
import { services, type ServiceId } from "@/lib/data/services";

const folder = "images/servicos";
const extensions = [".jpg", ".jpeg", ".png", ".webp"];

/**
 * Foto de cada serviço, se existir: basta salvar o arquivo em
 * public/images/servicos/ com o id do serviço como nome (ex: casamento.jpg).
 * Serviço sem foto continua com o "Imagem em breve".
 *
 * Roda só no servidor (lê o disco). Como a página é gerada no build (SSG),
 * uma foto nova só aparece em produção depois de um novo deploy; no
 * `npm run dev` aparece ao recarregar a página.
 */
export function findServiceImages(): Partial<Record<ServiceId, string>> {
  const images: Partial<Record<ServiceId, string>> = {};

  for (const { id } of services) {
    const extension = extensions.find((ext) =>
      fs.existsSync(path.join(process.cwd(), "public", folder, `${id}${ext}`)),
    );
    if (extension) images[id] = `/${folder}/${id}${extension}`;
  }

  return images;
}
