/**
 * ID de medição do Google Analytics 4 (formato "G-XXXXXXXXXX"), definido na
 * variável NEXT_PUBLIC_GA_MEASUREMENT_ID. Sem ela (ou com valor fora do
 * formato), o site não carrega o Google Analytics, não mostra o banner de
 * cookies e a CSP continua bloqueando os domínios do Google.
 *
 * O formato é validado porque o ID entra na URL do script e decide se a CSP
 * libera domínios externos — um valor qualquer não pode chegar até lá.
 * Ver docs/10-analytics-e-cookies.md.
 */
const rawId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

export const gaMeasurementId = rawId && /^G-[A-Z0-9]{4,20}$/.test(rawId) ? rawId : undefined;
