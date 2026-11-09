// Estilos e peças comuns aos formulários do site (orçamento e aulas), para
// os dois ficarem idênticos em aparência, foco e mensagens de erro.

export const inputClasses =
  "w-full rounded-sm border bg-white px-4 py-2.5 text-[15px] placeholder:text-banquete-dark/70 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-1 focus-visible:outline-banquete-rose";
// Cor da borda em classes separadas: aplicar "border-banquete-border" e
// "border-red-500" juntas no mesmo elemento deixaria o resultado depender da
// ordem do CSS gerado, não da ordem no className.
export const validBorderClasses = "border-banquete-input-border focus:border-banquete-rose";
export const invalidBorderClasses = "border-red-500 focus:border-red-500";
export const linkClasses =
  "font-semibold text-banquete-rose underline underline-offset-2 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-banquete-rose";
export const labelClasses = "mb-1.5 block text-[13px] font-semibold ";

const submitBase =
  "flex min-h-11 flex-1 items-center justify-center rounded-sm px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-banquete-rose disabled:cursor-not-allowed disabled:opacity-60";
export const submitWhatsappClasses = `${submitBase} bg-whatsapp hover:bg-whatsapp-dark`;
export const submitEmailClasses = `${submitBase} bg-banquete-rose hover:bg-banquete-rose-dark`;

// Sem role="alert": no envio inválido o foco vai para o primeiro campo com
// erro, e o aria-describedby do campo já faz o leitor de tela ler a mensagem.
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-[13px] text-red-700">
      {message}
    </p>
  );
}
