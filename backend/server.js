require("dotenv").config();

const express    = require("express");
const axios      = require("axios");
const cors       = require("cors");
const nodemailer = require("nodemailer");
const path       = require("path");
const crypto     = require("crypto");
const rateLimit  = require("express-rate-limit");
const { criarRepositorio } = require("./transacoes");

const app = express();

// ─── Validação de variáveis de ambiente ───────────────────
// Falha no boot — melhor do que falhar silenciosamente em runtime
const REQUIRED_ENV = [
  "MERCADO_PAGO_ACCESS_TOKEN",
  "WEBHOOK_SECRET",
  "ADMIN_TOKEN",
  "EMAIL_USER",
  "EMAIL_PASSWORD",
];
const missingEnv   = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`❌ Variáveis de ambiente ausentes: ${missingEnv.join(", ")}`);
  process.exit(1);
}

// Segredos curtos são suscetíveis a brute-force — gere com: openssl rand -hex 32
if (process.env.WEBHOOK_SECRET.length < 32) {
  console.error("❌ WEBHOOK_SECRET deve ter pelo menos 32 caracteres");
  process.exit(1);
}
if (process.env.ADMIN_TOKEN.length < 32) {
  console.error("❌ ADMIN_TOKEN deve ter pelo menos 32 caracteres");
  process.exit(1);
}

const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const WEBHOOK_SECRET  = process.env.WEBHOOK_SECRET;
const ADMIN_TOKEN     = process.env.ADMIN_TOKEN;
const PORT            = process.env.PORT || 3000;
const repositorio     = criarRepositorio(path.join(__dirname, "transacoes.json"));

// ─── Catálogo de ingressos (fonte da verdade do preço) ────
// O preço NUNCA vem do cliente: antes, o body trazia "valor" e qualquer
// pessoa podia pagar R$ 0,01 por qualquer ingresso. O cliente envia só o
// id; título e preço saem daqui. Vazio por padrão — cadastre os ingressos
// do evento antes de colocar o backend no ar.
// Exemplo: { "cha-das-flores": { titulo: "Chá das Flores", preco: 150.0 } }
const CATALOGO_INGRESSOS = Object.freeze({});

// ─── Fingerprint: remove header "X-Powered-By: Express" ──
// Revelar a stack facilita ataques direcionados a CVEs do Express/Node
app.disable("x-powered-by");

// ─── Trust proxy ─────────────────────────────────────────
// Necessário para que rate limiting use o IP real do cliente
// quando há reverse proxy (Nginx, Cloudflare) na frente.
// Sem isso, req.ip retorna o IP do proxy e o rate limiter
// conta todas as requisições como vindas do mesmo cliente.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// ─── Segurança: HTTPS redirect em produção ────────────────
// Usa o host configurado em BACKEND_URL, não o header Host da requisição —
// refletir o Host permitiria montar redirects para um domínio arbitrário.
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && !req.secure) {
    if (!process.env.BACKEND_URL) return res.status(400).json({ error: "HTTPS obrigatório" });
    return res.redirect(307, `${new URL(process.env.BACKEND_URL).origin}${req.originalUrl}`);
  }
  next();
});

// ─── Segurança: Headers de resposta ───────────────────────
app.use((req, res, next) => {
  // Força HTTPS por 1 ano e inclui subdomínios
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  // Impede que a API seja carregada dentro de um <iframe> (clickjacking)
  res.setHeader("X-Frame-Options", "DENY");
  // Impede MIME-type sniffing — o browser respeita o Content-Type declarado
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Não envia o URL de origem em requisições cross-origin
  res.setHeader("Referrer-Policy", "no-referrer");
  // CSP restritivo para API pura — nenhum recurso externo deve ser carregado por este servidor
  res.setHeader("Content-Security-Policy", "default-src 'none'");
  // Desativa features de browser não necessárias para uma API
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  next();
});

// Nenhum payload legítimo (preference ou webhook) passa de poucos KB
app.use(express.json({ limit: "100kb" }));

// ─── CORS ─────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || "https://www.saladobanquetelm.com.br",
  "https://saladobanquetelm.com.br",
];

if (process.env.NODE_ENV === "development") {
  allowedOrigins.push("http://localhost:3000", "http://localhost:5173");
}

app.use(
  cors({
    origin(origin, callback) {
      // origin é undefined em requisições same-origin e ferramentas como curl/Postman.
      // Em produção, considerar bloquear !origin para máxima segurança
      // CORS é proteção de browser — não substitui autenticação.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`⚠️ CORS bloqueado para origem: ${origin}`);
        callback(new Error("CORS não permitido"));
      }
    },
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  })
);

// ─── Rate limiting ────────────────────────────────────────
const createPreferenceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Muitas requisições, tente novamente mais tarde",
  standardHeaders: true,
  legacyHeaders: false,
  // SEGURANÇA: Em produção, até admin sofre rate limiting
  // Bypass seria apenas para IPs internos (gerência)
  skip: (req) => process.env.NODE_ENV !== "production" && req.header("Authorization") === `Bearer ${ADMIN_TOKEN}`,
});

const transacoesLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: "Limite de requisições excedido",
});

// Webhooks legítimos chegam em baixa frequência; o limite protege a
// validação HMAC (custo de CPU) contra flood com assinaturas falsas.
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Email ────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verifica conexão SMTP no boot para detectar credenciais inválidas antes de um pagamento real
transporter.verify().then(() => {
  console.log("✉️  SMTP verificado com sucesso");
}).catch((err) => {
  console.error("❌ Falha na verificação SMTP:", err.message);
});

// ─── Validação e autenticação ─────────────────────────────

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Compara segredos em tempo constante. Fazer o hash antes iguala o tamanho
// dos buffers (timingSafeEqual exige isso) sem vazar o tamanho do token.
function segredoConfere(recebido, esperado) {
  const a = crypto.createHash("sha256").update(String(recebido)).digest();
  const b = crypto.createHash("sha256").update(String(esperado)).digest();
  return crypto.timingSafeEqual(a, b);
}

function autenticarAdmin(req, res, next) {
  const match = /^Bearer (\S+)$/.exec(req.header("Authorization") || "");
  const token = match?.[1];

  if (!token || !segredoConfere(token, ADMIN_TOKEN)) {
    // Loga tentativas com token presente — token ausente é ruído de scanners
    if (token) console.warn("⚠️ Tentativa de acesso não autorizado com token inválido");
    return res.status(401).json({ error: "Não autorizado" });
  }
  next();
}

function isPaymentId(id) {
  return (typeof id === "string" || typeof id === "number") && /^\d{1,20}$/.test(String(id));
}

// ─── Validação de assinatura do Mercado Pago ──────────────
// O MP assina um template, NÃO o body completo.
// Header x-signature: "ts=<timestamp>,v1=<hmac>"
// Template assinado: "id:<data_id>;request-id:<x_request_id>;ts:<ts>;"
// Ref: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
function validarAssinaturaMercadoPago(req) {
  const xSignature = req.header("x-signature");
  const xRequestId = req.header("x-request-id");

  if (!xSignature || !xRequestId) return false;

  // Extrai ts e v1 do header no formato "ts=xxx,v1=yyy"
  const parts = {};
  for (const pair of xSignature.split(",")) {
    const separatorIndex = pair.indexOf("=");
    if (separatorIndex === -1) continue;
    const key   = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();
    if (key && value) parts[key] = value;
  }

  const { ts, v1 } = parts;
  if (!ts || !v1) return false;

  // O id entra no template assinado e depois na URL da API do MP: só dígitos.
  const dataId = req.body?.data?.id;
  if (!isPaymentId(dataId)) return false;

  const template = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(template)
    .digest("hex");

  // timingSafeEqual previne timing attacks — === em strings de segredo
  // vaza informação sobre quantos bytes batem via tempo de resposta
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    // timingSafeEqual lança se os buffers tiverem tamanhos diferentes
    return false;
  }
}

// ─── Email de confirmação ─────────────────────────────────
async function enviarEmailSeguro(email, dados) {
  if (!email || !isValidEmail(email)) {
    console.warn("❌ Email inválido, notificação não enviada");
    return;
  }

  const aprovado = dados.status === "approved";

  const assunto = aprovado
    ? "✅ Pagamento Confirmado - Sala do Banquete"
    : "❌ Pagamento Recusado - Sala do Banquete";

  // Corpo hardcoded — não interpola dados do usuário no HTML
  // para evitar injeção de conteúdo no email
  const corpo = aprovado
    ? `
      <h2>Pagamento Confirmado!</h2>
      <p>Seu pagamento foi <strong>processado com sucesso</strong>.</p>
      <p>Em breve entraremos em contato com as instruções para o evento. Qualquer dúvida, fale conosco pelo WhatsApp.</p>
    `
    : `
      <h2>Pagamento Recusado</h2>
      <p>Seu pagamento não foi aprovado pela instituição financeira.</p>
      <p>Entre em contato conosco para mais informações ou tente novamente.</p>
    `;

  try {
    await transporter.sendMail({
      from: `"Sala do Banquete" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: assunto,
      html: corpo,
    });
    // LGPD: não loga o endereço
    console.log(`✉️ Email enviado`);
  } catch (err) {
    console.error("❌ Erro ao enviar email:", err.message);
  }
}

// ─── Endpoints ────────────────────────────────────────────

// GET / — health check mínimo, sem revelar stack ou detalhes internos
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// ─── POST /criar-preference ───────────────────────────────
// Cria uma preferência de pagamento no Mercado Pago e devolve o init_point
app.post("/criar-preference", createPreferenceLimiter, async (req, res) => {
  try {
    const { email, nome, ingressoId, quantidade } = req.body;

    if (!email || !nome || !ingressoId || !quantidade) {
      return res.status(400).json({ success: false, error: "Faltam dados obrigatórios" });
    }

    if (!isValidEmail(email) || email.length > 255) {
      return res.status(400).json({ success: false, error: "Email inválido" });
    }

    if (typeof nome !== "string" || nome.length < 2 || nome.length > 100) {
      return res.status(400).json({ success: false, error: "Nome inválido (2–100 caracteres)" });
    }

    // hasOwn: impede que "__proto__"/"constructor" resolvam para algo do protótipo
    const ingresso =
      typeof ingressoId === "string" && Object.hasOwn(CATALOGO_INGRESSOS, ingressoId)
        ? CATALOGO_INGRESSOS[ingressoId]
        : null;
    if (!ingresso) {
      return res.status(400).json({ success: false, error: "Ingresso inválido" });
    }

    const quantNum = parseInt(quantidade, 10);
    if (!Number.isInteger(quantNum) || quantNum < 1 || quantNum > 100) {
      return res.status(400).json({ success: false, error: "Quantidade inválida (1–100)" });
    }

    const frontendBase = process.env.FRONTEND_URL || "https://www.saladobanquetelm.com.br";
    const backendBase  = process.env.BACKEND_URL;
    if (!backendBase) {
      if (process.env.NODE_ENV === "production") {
        return res.status(500).json({ success: false, error: "Configuração incompleta no servidor" });
      }
      console.warn("⚠️  BACKEND_URL não definido — notification_url do Mercado Pago será inválido");
    }
    const backendBaseResolved = backendBase || "http://localhost:3000";

    const preferencia = {
      items: [
        {
          title: ingresso.titulo,
          quantity: quantNum,
          unit_price: ingresso.preco,
          currency_id: "BRL",
        },
      ],
      payer: { email, name: nome },
      back_urls: {
        success: `${frontendBase}/ingressos?status=success`,
        failure: `${frontendBase}/ingressos?status=failure`,
        pending: `${frontendBase}/ingressos?status=pending`,
      },
      notification_url: `${backendBaseResolved}/webhook/pagamento`,
      auto_return: "approved",
    };

    const response = await axios.post(
      "https://api.mercadopago.com/checkout/preferences",
      preferencia,
      {
        headers: {
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    res.json({
      success: true,
      preferenceId: response.data.id,
      initPoint: response.data.init_point,
    });
  } catch (err) {
    // Loga detalhes internamente, nunca expõe stack trace para o cliente
    console.error("❌ Erro ao criar preference:", err.message);
    res.status(500).json({ success: false, error: "Erro ao processar pagamento" });
  }
});

// ─── POST /webhook/pagamento ──────────────────────────────
// Recebe notificações do Mercado Pago após cada transação.
// IMPORTANTE: deve responder 200 rapidamente — o MP tem timeout curto
// e reenviar o webhook se não receber resposta a tempo.
app.post("/webhook/pagamento", webhookLimiter, async (req, res) => {
  try {
    // CRÍTICO: Toda requisição MUST ter assinatura válida
    // Sem isso, atacante pode gerar ingressos/emails sem pagar
    if (!validarAssinaturaMercadoPago(req)) {
      console.warn("⚠️ Webhook rejeitado: assinatura inválida");
      // Loga apenas IP/timestamp para auditoria (sem PII)
      console.warn(`   IP: ${req.ip}, Time: ${new Date().toISOString()}`);
      return res.status(401).json({ error: "Assinatura inválida" });
    }

    const { type, data } = req.body;

    if (type === "payment") {
      // data.id já foi validado como numérico em validarAssinaturaMercadoPago
      const paymentResponse = await axios.get(
        `https://api.mercadopago.com/v1/payments/${encodeURIComponent(data.id)}`,
        {
          headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
          timeout: 10000,
        }
      );

      const pagamento = paymentResponse.data;
      const transacao = {
        transactionId: pagamento.id,
        status:        pagamento.status,
        // LGPD: armazenamos email e nome pois são necessários para envio do ingresso.
        // Sem e-mail, fica null — antes um endereço fictício recebia a notificação.
        email:         pagamento.payer?.email || null,
        nome:          pagamento.payer?.first_name || "Cliente",
        valor:         pagamento.transaction_amount || 0,
        ingresso:      pagamento.description || "Ingresso",
      };

      // Aguarda a gravação ANTES do e-mail: se o webhook for repetido
      // (retry do MP ou replay), salvar() devolve false e nenhum e-mail
      // duplicado é enviado.
      const novaTransacao = await repositorio.salvar(transacao);
      if (!novaTransacao) {
        return res.status(200).json({ success: true, duplicate: true });
      }

      try {
        await enviarEmailSeguro(transacao.email, transacao);
      } catch (emailErr) {
        console.error("❌ Falha ao enviar email:", emailErr.message);
      }

      // Loga ID da transação para auditoria — não loga email ou valor
      console.log(`✅ Pagamento ${transacao.status}`);
      return res.status(200).json({ success: true });
    }

    // Outros tipos de evento (ex: "merchant_order") — acusa recebimento sem processar
    res.status(200).json({ received: true });
  } catch (err) {
    // Mensagem genérica ao MP — detalhes ficam no log do servidor
    console.error("❌ Erro ao processar webhook:", err.message);
    res.status(500).json({ error: "Erro ao processar webhook" });
  }
});

// ─── GET /transacoes ──────────────────────────────────────
// Endpoint protegido — exige ADMIN_TOKEN no header Authorization.
// Contém PII (email, nome) — usar apenas em ambiente seguro.
app.get("/transacoes", transacoesLimiter, autenticarAdmin, async (req, res) => {
  try {
    const transacoes = await repositorio.load();
    res.json(transacoes);
  } catch (err) {
    console.error("❌ Erro ao ler transações:", err.message);
    res.status(500).json({ error: "Erro ao ler transações" });
  }
});

// ─── Tratamento de erros ──────────────────────────────────
// 404 e erros em JSON genérico. Sem isto, o Express responde com a página
// HTML padrão — que inclui o stack trace completo fora de NODE_ENV=production.
app.use((req, res) => {
  res.status(404).json({ error: "Não encontrado" });
});

// eslint-disable-next-line no-unused-vars -- Express identifica o handler de erro pela aridade 4
app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") return res.status(413).json({ error: "Payload muito grande" });
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "JSON inválido" });
  if (err.message === "CORS não permitido") return res.status(403).json({ error: "Origem não permitida" });
  console.error("❌ Erro não tratado:", err.message);
  res.status(500).json({ error: "Erro interno" });
});

// ─── Boot ─────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`🔒 CORS permitido para: ${allowedOrigins.join(", ")}`);
  console.log(`📝 NODE_ENV: ${process.env.NODE_ENV || "development"}\n`);
});

// ─── Graceful shutdown ────────────────────────────────────
// Necessário em ambientes containerizados (Docker, Kubernetes) para não dropar
// conexões ativas quando o processo recebe SIGTERM no deploy.
function gracefulShutdown(signal) {
  console.log(`\n${signal} recebido. Encerrando servidor graciosamente...`);
  server.close(() => {
    console.log("✅ Servidor encerrado.");
    process.exit(0);
  });
  // Force exit se conexões não fecharem em 10s
  setTimeout(() => {
    console.error("❌ Timeout de shutdown — forçando encerramento");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT",  () => gracefulShutdown("SIGINT"));

// Só a mensagem: o objeto completo pode carregar dados da requisição (PII)
process.on("unhandledRejection", (reason) => {
  console.error("❌ Promise rejeitada não tratada:", reason?.message ?? String(reason));
});

process.on("uncaughtException", (err) => {
  console.error("❌ Exceção não capturada:", err.message);
  process.exit(1);
});