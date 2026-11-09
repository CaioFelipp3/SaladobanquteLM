// Bloco <script type="application/ld+json"> com dados estruturados para o
// Google (padrão recomendado pelo Next.js, docs/01-app/02-guides/json-ld.md).
// O navegador não executa esse tipo de script; é só dado.
//
// Único dangerouslySetInnerHTML do site. É seguro porque os dados são
// constantes nossas (contato, textos de tradução), nunca entrada do visitante,
// e o "<" vira <: nenhum texto consegue fechar a tag </script>.
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
