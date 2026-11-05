# 10 — Google Analytics e banner de cookies

O site mede as visitas com o **Google Analytics 4 (GA4)**, só para quem aceitar os cookies de análise. A parte legal (LGPD, base legal, texto da política) está em [`07-protecao-de-dados.md`](./07-protecao-de-dados.md). Este guia cobre como ligar, como funciona e o que dá para ver no painel.

## Como ligar

1. **Crie a propriedade.** Em [analytics.google.com](https://analytics.google.com), crie uma conta/propriedade para a Sala do Banquete, com fuso de Brasília e moeda Real.
2. **Crie um fluxo de dados Web** com o endereço do site. Deixe a **medição otimizada** ligada: ela registra page views (inclusive as navegações internas do Next), rolagem e cliques em links externos, como os do WhatsApp e do Instagram.
3. **Copie o ID da métrica** (começa com `G-`).
4. **Ajustes de privacidade na propriedade** (a política de privacidade promete isso):
   - *Administrador → Coleta e modificação de dados → Retenção de dados*: **2 meses** (é o padrão; os relatórios padrão agregados não são afetados).
   - *Coleta de dados*: **Google Signals desativado**.
5. **Cadastre na Vercel.** Em *Settings → Environment Variables*, crie `NEXT_PUBLIC_GA_MEASUREMENT_ID` com o ID, para *Production* (e *Preview*, se quiser medir lá).
6. **Faça um novo deploy.** A variável é lida **no build**: ela entra no JavaScript do navegador e na CSP. Só cadastrar não basta.

Sem a variável, ou com um valor fora do formato `G-XXXX`, o site fica como antes: sem banner, sem link de preferências no rodapé e com a CSP bloqueando o Google.

## Como funciona

```
Primeira visita
  → banner "Cookies e privacidade" (Aceitar | Recusar)
      ├─ Recusar → escolha salva; nada do Google carrega
      └─ Aceitar → escolha salva → gtag.js carrega → page view da página atual
Visitas seguintes (até 12 meses)
  → escolha lida do localStorage; GA carrega direto se foi "Aceitar"
Rodapé → "Preferências de cookies" → banner de novo
  └─ Aceitar → Recusar: apaga os cookies _ga e recarrega a página
```

| Arquivo | Papel |
|---|---|
| [`lib/analytics/config.ts`](../lib/analytics/config.ts) | Lê e valida o ID de medição |
| [`lib/analytics/consent.ts`](../lib/analytics/consent.ts) | Guarda a escolha (localStorage, 12 meses) e avisa os componentes quando ela muda |
| [`lib/analytics/gtag.ts`](../lib/analytics/gtag.ts) | Carrega o gtag.js, envia eventos (`trackEvent`) e apaga os cookies na revogação |
| [`components/analytics/GoogleAnalytics.tsx`](../components/analytics/GoogleAnalytics.tsx) | Carrega o GA quando há consentimento |
| [`components/analytics/CookieBanner.tsx`](../components/analytics/CookieBanner.tsx) | O banner |
| [`components/analytics/CookiePreferencesButton.tsx`](../components/analytics/CookiePreferencesButton.tsx) | Link do rodapé que reabre o banner |
| [`next.config.ts`](../next.config.ts) | Libera os domínios do Google na CSP só quando o ID existe |

**Por que o banner aparece depois da página.** As páginas são geradas no build (SSG), e o servidor não sabe a escolha de cada visitante. O banner só é decidido no navegador, logo após o carregamento.

**Configuração do GA no código** (`loadGoogleAnalytics`): Consent Mode com `analytics_storage` concedido e `ad_storage`, `ad_user_data` e `ad_personalization` negados; `allow_google_signals: false`; `allow_ad_personalization_signals: false`; cookies com validade de 12 meses (o padrão do Google é 2 anos).

## Eventos de conversão

Além dos page views e cliques automáticos, o site envia:

| Evento | Quando | Parâmetros |
|---|---|---|
| `generate_lead` | Orçamento enviado pelo formulário | `method` (`whatsapp`/`email`), `service` (id do serviço) |
| `begin_checkout` | Comprador sai para o pagamento no Mercado Pago | `currency`, `value`, `items` (ingresso e quantidade) |

Os cliques no botão flutuante do WhatsApp e nos links de contato aparecem como evento `click` (medição otimizada, links externos), com o `link_url` `wa.me`.

Para marcar como **conversão** (*evento principal*): *Administrador → Eventos* e ligue a estrela de `generate_lead` e `begin_checkout`. Os eventos só aparecem nessa lista depois de acontecerem pelo menos uma vez.

**Regra:** nenhum evento leva dado pessoal (nome, telefone, e-mail, conteúdo da mensagem). Os Termos do Google Analytics também proíbem isso.

Para medir algo novo: `trackEvent("nome_do_evento", { ... })` em qualquer componente cliente. Sem consentimento, a chamada não faz nada.

## Como testar

1. Crie `.env.local` com `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...` e rode `npm run build && npm start`.
2. O banner aparece. Antes de clicar, na aba *Rede* do navegador não deve haver nenhuma requisição para `googletagmanager.com` ou `google-analytics.com`.
3. Clique em "Aceitar": o `gtag/js` carrega e aparecem requisições `collect`. No GA, *Relatórios → Tempo real* mostra a visita.
4. "Preferências de cookies" → "Recusar": a página recarrega e os cookies `_ga` somem (*Armazenamento → Cookies*).
5. Repita no Safari e pelo IP da rede (ex: celular). A CSP mudou, e mudanças de CSP já quebraram o site antes só no Safari (ver `05-seguranca.md`).

Para limpar a escolha durante os testes: no console, `localStorage.removeItem("cookie-consent")`.
