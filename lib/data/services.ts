/**
 * Lista de serviços oferecidos. Título/descrição ficam nos dicionários de
 * tradução (lib/i18n/messages/*.json, chave Services.items.<id>) — aqui só
 * o identificador estável (usado como key de lista e no <select> do
 * formulário de orçamento) e o ícone.
 */
export const services = [
  { id: "aniversario-infantil", icon: "🎈" },
  { id: "mesa-posta", icon: "🍽️" },
  { id: "bodas", icon: "💍" },
  { id: "etiqueta-mesa", icon: "🥂" },
  { id: "eventos-corporativos", icon: "💼" },
  { id: "aniversario-15-anos", icon: "👑" },
  { id: "casamento", icon: "💒" },
  { id: "cha-de-panela", icon: "🎀" },
  { id: "consultoria-acervo", icon: "📖" },
] as const;

export type ServiceId = (typeof services)[number]["id"];
