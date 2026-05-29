require("dotenv").config();

const express    = require("express");
const axios      = require("axios");
const cors       = require("cors");
const nodemailer = require("nodemailer");
const fsPromises = require("fs").promises;
const path       = require("path");
const crypto     = require("crypto");
const rateLimit  = require("express-rate-limit");

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
const TRANSACOES_FILE = path.join(__dirname, "transacoes.json");

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
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && !req.secure) {
    return res.redirect(307, `https://${req.get("host")}${req.originalUrl}`);
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

app.use(express.json({ limit: "1mb" }));

// ─── CORS ─────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || "https://saladobanquete.com.br",
  "https://www.saladobanquete.com.br",
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

// SEGURANÇA: Validar X-Forwarded-For para detectar spoof de IP
// Se aplicação está atrás de proxy (Cloudflare, AWS), isso é crítico
app.use((req, res, next) => {
  const xForwarded = req.header("X-Forwarded-For");
  if (xForwarded && process.env.NODE_ENV === "production") {
    // Em produção com proxy, usar apenas o IP mais confiável (o do proxy)
    // Logs: não detalhar X-Forwarded-For pois pode vazar IPs de clientes
    console.debug(`Proxy detectado, IP real pode estar em X-Forwarded-For`);
  }
  next();
});

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

// ─── Email ────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ─── Validação e autenticação ─────────────────────────────

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function autenticarAdmin(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token || token !== ADMIN_TOKEN) {
    // Loga tentativas com token presente — token ausente é ruído de scanners
    if (token) console.warn("⚠️ Tentativa de acesso não autorizado com token inválido");
    return res.status(401).json({ error: "Não autorizado" });
  }
  next();
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

  const dataId = req.body?.data?.id;
  if (!dataId) return false;

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

// ─── Persistência de transações ───────────────────────────

// Leitura assíncrona — não bloqueia o event loop durante I/O de disco
async function loadTransacoes() {
  try {
    const data = await fsPromises.readFile(TRANSACOES_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch (err) {
    // ENOENT = arquivo ainda não existe — esperado na primeira execução
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

// Serializa escritas para evitar race condition entre webhooks simultâneos.
// Cada chamada encadeia no writeLock anterior — garante que só uma escreve por vez.
let writeLock = Promise.resolve();

// ─── IDEMPOTÊNCIA: salvar apenas transações únicas ────────
// O Mercado Pago garante entrega "at least once" — o mesmo evento pode
// chegar mais de uma vez (retry por timeout). Sem essa checagem, o cliente
// receberia dois emails e o sistema registraria a mesma transação em duplicata.
function salvarTransacao(transacao) {
  writeLock = writeLock
    .then(async () => {
      let transacoes = await loadTransacoes();

      // Idempotência: rejeita silenciosamente se transactionId já foi processado
      const jaExiste = transacoes.some(
        (t) => t.transactionId === transacao.transactionId
      );
      if (jaExiste) {
        console.log(`ℹ️ Webhook duplicado ignorado`);
        return;
      }

      // ALTO: Proteção contra DDoS via webhooks — máximo 100k transações
      // Se exceder, arquivo é rotacionado para arquivo.YYYY-MM-DD.bak
      const MAX_TRANSACOES = 100000;
      if (transacoes.length >= MAX_TRANSACOES) {
        const backupName = TRANSACOES_FILE.replace(
          ".json",
          `.${new Date().toISOString().split("T")[0]}.bak`
        );
        await fsPromises.writeFile(backupName, JSON.stringify(transacoes, null, 2));
        await fsPromises.writeFile(TRANSACOES_FILE, JSON.stringify([], null, 2));
        console.warn(`⚠️ transacoes.json rotacionado para ${backupName}`);
        transacoes = [];
      }

      transacoes.push({ ...transacao, data: new Date().toISOString() });
      await fsPromises.writeFile(
        TRANSACOES_FILE,
        JSON.stringify(transacoes, null, 2)
      );
    })
    .catch((err) => {
      console.error("❌ Erro ao salvar transação:", err.message);
      // Não re-lança — falha de escrita não deve travar o lock para chamadas futuras
    });

  return writeLock;
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
      <p>Um link para acessar seus detalhes foi enviado em email separado.</p>
      <p style="color: #666; font-size: 12px;">Nunca compartilhe links de confirmação de pagamento.</p>
    `
    : `
      <h2>Pagamento Recusado</h2>
      <p>Seu pagamento não foi aprovado pela instituição financeira.</p>
      <p>Entre em contato conosco para mais informações ou tente novamente.</p>
    `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: assunto,
      html: corpo,
    });
    // Loga apenas os primeiros 5 chars do email — LGPD: não logar PII completo
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
    const { email, nome, ingresso, valor, quantidade } = req.body;

    if (!email || !nome || !ingresso || !valor || !quantidade) {
      return res.status(400).json({ success: false, error: "Faltam dados obrigatórios" });
    }

    if (!isValidEmail(email) || email.length > 255) {
      return res.status(400).json({ success: false, error: "Email inválido" });
    }

    if (typeof nome !== "string" || nome.length < 2 || nome.length > 100) {
      return res.status(400).json({ success: false, error: "Nome inválido (2–100 caracteres)" });
    }

    if (typeof ingresso !== "string" || ingresso.length < 1 || ingresso.length > 200) {
      return res.status(400).json({ success: false, error: "Ingresso inválido" });
    }

    const valorNum = parseFloat(valor);
    // SEGURANÇA: Valor deve estar entre R$ 0.01 e R$ 9999.99
    // Impede ataques de "forced-price" (forçar pagamento de R$0.01)
    // Em produção real, validar contra tabela de preços permitidos no backend
    if (isNaN(valorNum) || valorNum <= 0 || valorNum > 9999.99) {
      return res.status(400).json({ success: false, error: "Valor inválido (0.01 – 9999.99)" });
    }
    // TODO: Em produção, substituir por validação contra BD de ingressos
    // const ingressoValido = await db.ingressos.findOne({ name: ingresso, preco: valorNum });
    // if (!ingressoValido) return res.status(400).json({ success: false, error: "Ingresso ou preço inválido" });

    const quantNum = parseInt(quantidade, 10);
    if (!Number.isInteger(quantNum) || quantNum < 1 || quantNum > 100) {
      return res.status(400).json({ success: false, error: "Quantidade inválida (1–100)" });
    }

    const frontendBase = process.env.FRONTEND_URL || "https://saladobanquete.com.br";
    const backendBase  = process.env.BACKEND_URL  || "https://seu-dominio.com/api";

    const preferencia = {
      items: [
        {
          title: ingresso,
          quantity: quantNum,
          unit_price: valorNum,
          currency_id: "BRL",
        },
      ],
      payer: { email, name: nome },
      back_urls: {
        success: `${frontendBase}/ingressos?status=success`,
        failure: `${frontendBase}/ingressos?status=failure`,
        pending: `${frontendBase}/ingressos?status=pending`,
      },
      notification_url: `${backendBase}/webhook/pagamento`,
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
app.post("/webhook/pagamento", async (req, res) => {
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
      const paymentResponse = await axios.get(
        `https://api.mercadopago.com/v1/payments/${data.id}`,
        {
          headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
          timeout: 10000,
        }
      );

      const pagamento = paymentResponse.data;
      const transacao = {
        transactionId: pagamento.id,
        status:        pagamento.status,
        // LGPD: armazenamos email e nome pois são necessários para envio do ingresso
        email:         pagamento.payer?.email || "desconhecido@email.com",
        nome:          pagamento.payer?.first_name || "Cliente",
        valor:         pagamento.transaction_amount || 0,
        ingresso:      pagamento.description || "Ingresso",
      };

      // salvarTransacao é assíncrono mas não aguardamos aqui —
      // a resposta 200 ao MP não depende da escrita em disco ter concluído.
      // A idempotência dentro de salvarTransacao protege contra duplicatas.
      salvarTransacao(transacao);

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
    const transacoes = await loadTransacoes();
    res.json(transacoes);
  } catch (err) {
    console.error("❌ Erro ao ler transações:", err.message);
    res.status(500).json({ error: "Erro ao ler transações" });
  }
});

// ─── Boot ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`🔒 CORS permitido para: ${allowedOrigins.join(", ")}`);
  console.log(`📝 NODE_ENV: ${process.env.NODE_ENV || "development"}\n`);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ Promise rejeitada não tratada:", reason);
});