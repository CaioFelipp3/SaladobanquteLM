require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");

const app = express();

// ─────────────────────────────────────────────────────────
// SEGURANÇA: Headers e Middleware de Proteção
// ─────────────────────────────────────────────────────────

app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && !req.secure) {
    return res.redirect(307, `https://${req.get("host")}${req.originalUrl}`);
  }
  next();
});

app.use((req, res, next) => {
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

app.use(express.json({ limit: "1mb" }));

// ─────────────────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────────────────

const allowedOrigins = [
  process.env.FRONTEND_URL || "https://saladobanquete.com.br",
  "https://www.saladobanquete.com.br",
];

if (process.env.NODE_ENV === "development") {
  allowedOrigins.push("http://localhost:3000", "http://localhost:5173");
}

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS não permitido"));
      }
    },
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  })
);

// ─────────────────────────────────────────────────────────
// CONFIGURAÇÃO
// ─────────────────────────────────────────────────────────

const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const PORT = process.env.PORT || 3000;

if (!MP_ACCESS_TOKEN || !WEBHOOK_SECRET || !ADMIN_TOKEN) {
  console.error("❌ Variáveis de ambiente críticas não configuradas: MERCADO_PAGO_ACCESS_TOKEN, WEBHOOK_SECRET, ADMIN_TOKEN");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const TRANSACOES_FILE = path.join(__dirname, "transacoes.json");

// ─────────────────────────────────────────────────────────
// RATE LIMITING
// ─────────────────────────────────────────────────────────

const createPreferenceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Muitas requisições, tente novamente mais tarde",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.header("Authorization") === `Bearer ${ADMIN_TOKEN}`,
});

const transacoesLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: "Limite de requisições excedido",
});

// ─────────────────────────────────────────────────────────
// AUTENTICAÇÃO E VALIDAÇÃO
// ─────────────────────────────────────────────────────────

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function autenticarAdmin(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token || token !== ADMIN_TOKEN) {
    if (token) console.warn("⚠️ Tentativa de acesso não autorizado com token inválido");
    return res.status(401).json({ error: "Não autorizado" });
  }
  next();
}

// O Mercado Pago assina o body raw — capturar antes do express.json() parsear
function validarAssinaturaMercadoPago(req) {
  const xSignature = req.header("x-signature");
  const xRequestId = req.header("x-request-id");

  if (!xSignature || !xRequestId) return false;

  const rawBody = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  return xSignature === expectedSignature;
}

// ─────────────────────────────────────────────────────────
// FUNÇÕES AUXILIARES
// ─────────────────────────────────────────────────────────

function salvarTransacao(transacao) {
  try {
    let transacoes = [];

    if (fs.existsSync(TRANSACOES_FILE)) {
      const dados = fs.readFileSync(TRANSACOES_FILE, "utf-8");
      transacoes = JSON.parse(dados || "[]");
    }

    transacoes.push({ ...transacao, data: new Date().toISOString() });
    fs.writeFileSync(TRANSACOES_FILE, JSON.stringify(transacoes, null, 2));
  } catch (erro) {
    console.error("❌ Erro ao salvar transação:", erro.message);
  }
}

async function enviarEmailSeguro(email, dados) {
  if (!email || !isValidEmail(email)) {
    console.warn("❌ Email inválido, não será enviado");
    return;
  }

  const assunto = dados.status === "approved"
    ? "✅ Pagamento Confirmado - Sala do Banquete"
    : "❌ Pagamento Recusado - Sala do Banquete";

  const corpo = dados.status === "approved"
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
    console.log(`✉️ Email enviado para ${email.slice(0, 5)}***`);
  } catch (erro) {
    console.error("❌ Erro ao enviar email:", erro.message);
  }
}

// ─────────────────────────────────────────────────────────
// ENDPOINTS
// ─────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.json({ mensagem: "Backend Sala do Banquete rodando! ✅" });
});

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
      return res.status(400).json({ success: false, error: "Nome inválido (2-100 caracteres)" });
    }

    if (typeof ingresso !== "string" || ingresso.length < 1 || ingresso.length > 200) {
      return res.status(400).json({ success: false, error: "Ingresso inválido" });
    }

    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum <= 0 || valorNum > 9999.99) {
      return res.status(400).json({ success: false, error: "Valor inválido (deve ser entre 0.01 e 9999.99)" });
    }

    const quantNum = parseInt(quantidade);
    if (!Number.isInteger(quantNum) || quantNum < 1 || quantNum > 100) {
      return res.status(400).json({ success: false, error: "Quantidade inválida (1-100)" });
    }

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
        success: `${process.env.FRONTEND_URL || "https://saladobanquete.com.br"}/ingressos?status=success`,
        failure: `${process.env.FRONTEND_URL || "https://saladobanquete.com.br"}/ingressos?status=failure`,
        pending: `${process.env.FRONTEND_URL || "https://saladobanquete.com.br"}/ingressos?status=pending`,
      },
      notification_url: `${process.env.BACKEND_URL || "https://seu-dominio.com/api"}/webhook/pagamento`,
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
  } catch (erro) {
    console.error("❌ Erro ao criar preference");
    res.status(500).json({ success: false, error: "Erro ao processar pagamento" });
  }
});

app.post("/webhook/pagamento", async (req, res) => {
  try {
    if (!validarAssinaturaMercadoPago(req)) {
      console.warn("⚠️ Webhook com assinatura inválida rejeitado");
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
      const dados = {
        transactionId: pagamento.id,
        status: pagamento.status,
        email: pagamento.payer?.email || "desconhecido@email.com",
        nome: pagamento.payer?.first_name || "Cliente",
        valor: pagamento.transaction_amount || 0,
        ingresso: pagamento.description || "Ingresso",
      };

      salvarTransacao(dados);

      try {
        await enviarEmailSeguro(dados.email, dados);
      } catch (emailError) {
        console.error("Falha ao enviar email:", emailError.message);
      }

      console.log(`✅ Pagamento ${dados.status} processado`);
      res.status(200).json({ success: true });
    } else {
      res.status(200).json({ received: true });
    }
  } catch (erro) {
    console.error("❌ Erro ao processar webhook");
    res.status(500).json({ error: "Erro ao processar webhook" });
  }
});

app.get("/transacoes", transacoesLimiter, autenticarAdmin, (req, res) => {
  try {
    if (!fs.existsSync(TRANSACOES_FILE)) return res.json([]);

    const dados = fs.readFileSync(TRANSACOES_FILE, "utf-8");
    res.json(JSON.parse(dados || "[]"));
  } catch (erro) {
    console.error("❌ Erro ao ler transações");
    res.status(500).json({ error: "Erro ao ler transações" });
  }
});

// ─────────────────────────────────────────────────────────
// INICIAR SERVIDOR
// ─────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`🔒 CORS permitido para: ${allowedOrigins.join(", ")}`);
  console.log(`📝 NODE_ENV: ${process.env.NODE_ENV || "development"}\n`);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Promise rejeitada não tratada:", promise, reason);
});
