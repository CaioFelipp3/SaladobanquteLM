import { z } from "zod";

// O zod 4 testa `new Function("")` para decidir se pode compilar validadores
// otimizados. A CSP do site (next.config.ts) bloqueia eval — o zod se recupera
// sozinho, mas o navegador registra uma violação de CSP a cada carregamento.
// jitless desliga o teste: mesma validação, sem eval e sem ruído na CSP.
z.config({ jitless: true });

// Caracteres invisíveis usados para falsificar o texto exibido: controles
// bidirecionais (U+202A–202E, U+2066–2069) invertem a ordem visual de um
// trecho; marcas de direção (U+200E/F), zero-width space (U+200B) e BOM
// (U+FEFF) escondem conteúdo. Nenhum deles tem uso legítimo num formulário.
// O zero-width joiner (U+200D) fica de fora: ele compõe emojis como 👨‍👩‍👧.
// Escritos como \u de propósito: os caracteres literais ficam invisíveis no
// editor e na revisão do código (o próprio padrão "Trojan Source").
const SPOOFING_CHARS = /[\u200B\u200E\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/;

// Caracteres de controle (U+0000–U+001F, U+007F–U+009F), exceto quebra de
// linha e tab — só fazem sentido no campo de mensagem, que é multilinha.
const CONTROL_CHARS_EXCEPT_NEWLINE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/;

/**
 * Normaliza para NFC antes de validar: "é" pode chegar como um caractere só
 * (U+00E9) ou como "e" + acento combinante (U+0065 U+0301), comum em texto
 * colado de PDFs ou digitado no macOS. Sem normalizar, um nome legítimo como
 * "José" seria recusado e dois textos visualmente iguais seriam diferentes.
 */
const normalizedText = () => z.string().normalize("NFC").trim();

/*
 * Campos comuns aos formulários do site (orçamento e interesse em aulas).
 * Cada mensagem de erro é uma CHAVE (não o texto final) — o componente
 * traduz via t(`errors.${chave}`), mantendo validação e tradução
 * desacopladas.
 */

export const nameField = normalizedText()
  .min(2, "nameRequired")
  .max(80, "nameInvalid")
  // Letras (com acentos, inclusive combinantes), espaço, hífen e apóstrofo
  // (reto ou tipográfico). Espaço literal em vez de \s: \s aceitaria quebra
  // de linha e tab, que permitiriam injetar "linhas" falsas na mensagem
  // final (ex: "João\nTelefone: 000" fingindo ser outro campo).
  .regex(/^[\p{L}\p{M} '’-]+$/u, "nameInvalid");

export const phoneField = z
  .string()
  .trim()
  .max(20, "phoneInvalid")
  // Só dígitos e a pontuação usual de telefone: "+55 (27) 99999-9999".
  // Antes contávamos apenas os dígitos, e "<b>27999999999</b>" passava.
  .regex(/^\+?[\d\s().-]+$/, "phoneInvalid")
  .refine((value) => {
    let digits = value.replace(/\D/g, "");
    // DDI do Brasil opcional: "55 27 99999-9999" vira "27 99999-9999".
    if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
      digits = digits.slice(2);
    }
    return digits.length === 10 || digits.length === 11;
  }, "phoneInvalid");

export const messageField = normalizedText()
  .max(500, "messageTooLong")
  .refine((value) => !CONTROL_CHARS_EXCEPT_NEWLINE.test(value), "messageInvalid")
  .refine((value) => !SPOOFING_CHARS.test(value), "messageInvalid");

// Ciência da Política de Privacidade (/privacidade). Não é a base legal do
// tratamento (essa é o art. 7º, V da LGPD), mas garante transparência:
// ninguém envia dados sem ter tido a chance de ler a política.
export const privacyField = z.literal(true, "privacyRequired");
