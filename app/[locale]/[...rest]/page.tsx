import { notFound } from "next/navigation";

// Captura qualquer caminho que não corresponda a uma página (ex: /pt/xyz) e
// dispara o not-found.tsx do locale — sem esta rota, o Next.js cairia na 404
// padrão dele, em inglês e fora do layout do site.
export default function CatchAllPage() {
  notFound();
}
