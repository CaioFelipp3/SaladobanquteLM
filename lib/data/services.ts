/**
 * Lista de serviços oferecidos. Título/descrição ficam nos dicionários de
 * tradução (lib/i18n/messages/*.json, chave Services.items.<id>) — aqui só
 * o identificador estável (usado como key de lista e no <select> do
 * formulário de orçamento).
 */
export const services = [
  { id: "aniversario-infantil" },
  { id: "mesa-posta" },
  { id: "bodas" },
  { id: "etiqueta-mesa" },
  { id: "eventos-corporativos" },
  { id: "aniversario-15-anos" },
  { id: "casamento" },
  { id: "cha-de-panela" },
  { id: "consultoria-acervo" },
] as const;

export type ServiceId = (typeof services)[number]["id"];
