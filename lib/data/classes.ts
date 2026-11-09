/**
 * Aulas de etiqueta. Nome, descrição e detalhes ficam nos dicionários de
 * tradução (lib/i18n/messages/*.json, chave Classes.items.<id>) — aqui só o
 * identificador estável (key de lista, <select> do formulário de interesse e
 * nome da foto em public/images/aulas/<id>.jpg).
 *
 * Para incluir uma aula: acrescente o id aqui e o texto nos dois idiomas.
 */
export const classes = [{ id: "aula-1" }, { id: "aula-2" }, { id: "aula-3" }] as const;

export type ClassId = (typeof classes)[number]["id"];
