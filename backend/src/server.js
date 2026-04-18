// server.js - Backend Mercado Pago para Sala do Banquete
// Node.js Express + Mercado Pago Integration - VERSÃO SEGURA

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
// SECURITY: Headers e Middleware de Proteção
// ─────────────────────────────────────────────────────────

// 🔒 HTTPS redirect (Phase 2)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && !req.secure) {
    return res.redirect(307, `https://${req.get("host")}${req.originalUrl}`);
  }
  next();
});

// 🔒 HSTS Header
app.use((req, res, next) => {
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );
  // Proteção contra click-jacking
  res.setHeader("X-Frame-Options", "DENY");
  // Proteção contra MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Referrer Policy
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

// Middleware
app.use(express.json({ limit: "1mb" })); // Limitar tamanho do JSON

// 🔒 CORS SEGURO (Problema 3)
const allowedOrigins = [
  process.env.FRONTEND_URL || "https://saladobanquete.com.br",
  "https://www.saladobanquete.com.br",
];

// Em desenvolvimento, permitir localhost
if (process.env.NODE_ENV === "development") {
  allowedOrigins.push("http://localhost:3000", "http://localhost:5173");
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Se não houver origin (requisição do mesmo domínio), permitir
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS não permitido"));
      }
    },
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    optionsSuccessStatus: 200,
  }),
);

// Variáveis de ambiente
const MP_PUBLIC_KEY = process.env.MERCADO_PAGO_PUBLIC_KEY;
const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const PORT = process.env.PORT || 3000;

// Validação de variáveis críticas
if (!MP_ACCESS_TOKEN || !WEBHOOK_SECRET || !ADMIN_TOKEN) {
  console.error(
    "❌ Variáveis de ambiente críticas não configuradas: MERCADO_PAGO_ACCESS_TOKEN, WEBHOOK_SECRET, ADMIN_TOKEN",
  );
  process.exit(1);
}

// Configurar email (Nodemailer)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Arquivo para salvar transações
const TRANSACOES_FILE = path.join(__dirname, "transacoes.json");

// 🔒 Rate Limiting (Problema 6)
const createPreferenceLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 requisições por IP/minuto
  message: "Muitas requisições, tente novamente mais tarde",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limit para admin token
    return req.header("Authorization") === `Bearer ${ADMIN_TOKEN}`;
  },
});

const transacoesLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: "Limite de requisições excedido",
});

// ─────────────────────────────────────────────────────────
// SEGURANÇA: Validação e Autenticação
// ─────────────────────────────────────────────────────────

// Validar email
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 🔒 Middleware de autenticação para admin (Problema 2)
function autenticarAdmin(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token || token !== ADMIN_TOKEN) {
    // Log alertado sem retornar o token
    if (token) {
      console.warn(`⚠️ Tentativa de acesso não autorizado com token inválido`);
    }
    return res.status(401).json({ error: "Não autorizado" });
  }
  next();
}

// 🔒 Validar assinatura HMAC do Mercado Pago (Problema 1)
function validarAssinaturaMercadoPago(req) {
  const xSignature = req.header("x-signature");
  const xRequestId = req.header("x-request-id");

  if (!xSignature || !xRequestId) {
    return false;
  }

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

// Salvar transação (com validação básica)
function salvarTransacao(transacao) {
  try {
    let transacoes = [];

    if (fs.existsSync(TRANSACOES_FILE)) {
      const dados = fs.readFileSync(TRANSACOES_FILE, "utf-8");
      transacoes = JSON.parse(dados || "[]");
    }

    transacoes.push({
      ...transacao,
      data: new Date().toISOString(),
    });

    fs.writeFileSync(TRANSACOES_FILE, JSON.stringify(transacoes, null, 2));
  } catch (erro) {
    console.error("❌ Erro ao salvar transação:", erro.message);
  }
}

// Enviar email seguro (Problema 8: não expor dados sensíveis)
async function enviarEmailSeguro(email, dados) {
  if (!email || !isValidEmail(email)) {
    console.warn("❌ Email inválido, não será enviado");
    return;
  }

  const assunto =
    dados.status === "approved"
      ? "✅ Pagamento Confirmado - Sala do Banquete"
      : "❌ Pagamento Recusado - Sala do Banquete";

  // Não expor dados de transação completos por email
  const corpo =
    dados.status === "approved"
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
    // Não falhar o webhook se email falhar
  }
}

// ─────────────────────────────────────────────────────────
// ENDPOINTS
// ─────────────────────────────────────────────────────────

// Health check
app.get("/", (req, res) => {
  res.json({ mensagem: "Backend Sala do Banquete rodando! ✅" });
});

/**
 * POST /criar-preference
 * Cria uma preferência de pagamento no Mercado Pago
 * 🔒 Protegido por rate limiting
 */
app.post("/criar-preference", createPreferenceLimiter, async (req, res) => {
  try {
    const { email, nome, ingresso, valor, quantidade } = req.body;

    // 🔒 Validação rigorosa de entrada (Problema 5)
    if (!email || !nome || !ingresso || !valor || !quantidade) {
      return res.status(400).json({
        success: false,
        error: "Faltam dados obrigatórios",
      });
    }

    // Validar email
    if (!isValidEmail(email) || email.length > 255) {
      return res.status(400).json({
        success: false,
        error: "Email inválido",
      });
    }

    // Validar nome
    if (typeof nome !== "string" || nome.length < 2 || nome.length > 100) {
      return res.status(400).json({
        success: false,
        error: "Nome inválido (2-100 caracteres)",
      });
    }

    // Validar ingresso
    if (
      typeof ingresso !== "string" ||
      ingresso.length < 1 ||
      ingresso.length > 200
    ) {
      return res.status(400).json({
        success: false,
        error: "Ingresso inválido",
      });
    }

    // Validar valor (positivo e razoável)
    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum <= 0 || valorNum > 9999.99) {
      return res.status(400).json({
        success: false,
        error: "Valor inválido (deve ser entre 0.01 e 9999.99)",
      });
    }

    // Validar quantidade
    const quantNum = parseInt(quantidade);
    if (!Number.isInteger(quantNum) || quantNum < 1 || quantNum > 100) {
      return res.status(400).json({
        success: false,
        error: "Quantidade inválida (1-100)",
      });
    }

    // Dados da preferência para Mercado Pago
    const preferencia = {
      items: [
        {
          title: ingresso,
          quantity: quantNum,
          unit_price: valorNum,
          currency_id: "BRL",
        },
      ],
      payer: {
        email: email,
        name: nome,
      },
      back_urls: {
        success: `${process.env.FRONTEND_URL || "https://saladobanquete.com.br"}/ingressos?status=success`,
        failure: `${process.env.FRONTEND_URL || "https://saladobanquete.com.br"}/ingressos?status=failure`,
        pending: `${process.env.FRONTEND_URL || "https://saladobanquete.com.br"}/ingressos?status=pending`,
      },
      notification_url: `${process.env.BACKEND_URL || "https://seu-dominio.com/api"}/webhook/pagamento`,
      auto_return: "approved",
    };

    // Criar preference no Mercado Pago
    const response = await axios.post(
      "https://api.mercadopago.com/checkout/preferences",
      preferencia,
      {
        headers: {
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 segundos de timeout
      },
    );

    // NÃO retornar PUBLIC_KEY (já está no frontend)
    res.json({
      success: true,
      preferenceId: response.data.id,
      initPoint: response.data.init_point,
    });
  } catch (erro) {
    console.error("❌ Erro ao criar preference");
    res.status(500).json({
      success: false,
      error: "Erro ao processar pagamento",
    });
  }
});

/**
 * POST /webhook/pagamento
 * Recebe notificações do Mercado Pago
 * 🔒 Validada com assinatura HMAC
 */
app.post("/webhook/pagamento", async (req, res) => {
  try {
    // 🔒 Validar assinatura deve ser PRIMEIRA coisa (Problema 1)
    if (!validarAssinaturaMercadoPago(req)) {
      console.warn("⚠️ Webhook com assinatura inválida rejeitado");
      return res.status(401).json({ error: "Assinatura inválida" });
    }

    const { type, data } = req.body;

    if (type === "payment") {
      const paymentId = data.id;

      // Buscar dados do pagamento no Mercado Pago
      const paymentResponse = await axios.get(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
          },
          timeout: 10000,
        },
      );

      const pagamento = paymentResponse.data;

      // Extrair e validar informações
      const dados = {
        transactionId: pagamento.id,
        status: pagamento.status,
        email: pagamento.payer?.email || "desconhecido@email.com",
        nome: pagamento.payer?.first_name || "Cliente",
        valor: pagamento.transaction_amount || 0,
        ingresso: pagamento.description || "Ingresso",
      };

      // Salvar transação
      salvarTransacao(dados);

      // 🔒 Enviar email com cuidado (Problema 8 & 9)
      try {
        await enviarEmailSeguro(dados.email, dados);
      } catch (emailError) {
        console.error("Falha ao enviar email:", emailError.message);
        // Continuar mesmo se email falhar
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

/**
 * GET /transacoes
 * Lista transações (PROTEGIDO com autenticação)
 * 🔒 Requer token de admin
 */
app.get("/transacoes", transacoesLimiter, autenticarAdmin, (req, res) => {
  try {
    if (!fs.existsSync(TRANSACOES_FILE)) {
      return res.json([]);
    }

    const dados = fs.readFileSync(TRANSACOES_FILE, "utf-8");
    const transacoes = JSON.parse(dados || "[]");

    res.json(transacoes);
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

// Tratamento de erros não capturados
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Promise rejeitada não tratada:", promise, reason);
});
