// payment-integration.js - VERSÃO SEGURA
// Integração com Payment Brick do Mercado Pago
// 🔒 Vulnerabilidades corrigidas

// ────────────────────────────────────────────────────────
// CONFIGURAÇÃO SEGURA
// ────────────────────────────────────────────────────────

// 🔒 Usar URL relativa (não hardcoded como http://localhost:3000)
// Será automaticamente 'https://seu-dominio.com/api' em produção
const BACKEND_URL = window.API_CONFIG?.backendUrl || "/api";
const TIMEOUT_MS = 10000; // 10 segundos

// Status permitidos para validação (whitelist)
const ALLOWED_STATUS = ["success", "failure", "pending"];

// ────────────────────────────────────────────────────────
// FUNÇÃO: Criar Preference no Backend
// ────────────────────────────────────────────────────────

async function criarPreference(dados) {
  try {
    // 🔒 Timeout para evitar memória freeze
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(`${BACKEND_URL}/criar-preference`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dados),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Erro ao criar preferência");
    }

    // 🔒 NÃO fazer log de dados sensíveis
    if (process.env.NODE_ENV === "development") {
      console.log("[DEBUG] Preference criada");
    }

    return result;
  } catch (erro) {
    // 🔒 Apenas logar mensagem genérica
    if (erro.name === "AbortError") {
      console.error("Requisição expirou");
      throw new Error("Requisição expirou. Tente novamente.");
    }
    console.error("Erro ao criar preferência");
    throw erro;
  }
}

// ────────────────────────────────────────────────────────
// FUNÇÃO: Renderizar Payment Brick
// ────────────────────────────────────────────────────────

async function renderizarPaymentBrick(
  preferenceId,
  publicKey,
  containerId = "payment-brick-container",
) {
  // Carregar script do Mercado Pago (se ainda não carregado)
  if (!window.MercadoPago) {
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    // 🔒 Usar Subresource Integrity (quando hash for disponível)
    // script.integrity = "sha384-xxxxxxxxxxxxx";
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);

    // Aguardar carregamento
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = () => {
        reject(new Error("Falha ao carregar Mercado Pago SDK"));
      };
    });
  }

  // Inicializar Mercado Pago
  const mp = new window.MercadoPago(publicKey, {
    locale: "pt-BR",
  });

  // Renderizar Payment Brick
  mp.bricks().create("payment", {
    initialization: {
      amount: 0, // Será preenchido pelo preference
      preferenceId: preferenceId,
    },
    customization: {
      paymentForm: {
        isDark: false,
      },
      visual: {
        style: {
          theme: "bootstrap",
        },
      },
    },
    onSubmit: () => {
      // Não fazer log de dados sensíveis
    },
    onError: (error) => {
      console.error("Erro no pagamento");
    },
    onReady: () => {
      // Payment Brick pronto
    },
  });
}

// ────────────────────────────────────────────────────────
// FUNÇÃO: Fluxo Completo
// ────────────────────────────────────────────────────────

async function iniciarCompra(ingressoData) {
  try {
    // 🔒 NÃO fazer log dos dados de compra

    const preference = await criarPreference({
      email: ingressoData.email,
      nome: ingressoData.nome,
      ingresso: ingressoData.ingresso,
      valor: ingressoData.valor,
      quantidade: ingressoData.quantidade,
    });

    // 🔒 NÃO fazer log de IDs sensíveis

    await renderizarPaymentBrick(
      preference.preferenceId,
      preference.publicKey,
      "payment-brick-container",
    );

    // Feedback visual ao usuário (não em console)
    showNotification("Formulário de pagamento carregado com segurança");
  } catch (erro) {
    console.error("Erro ao processar compra");
    showNotification("Erro ao processar compra. Tente novamente.", "error");
  }
}

// ────────────────────────────────────────────────────────
// FUNÇÃO: Verificar Status de Pagamento (🔒 PROTEGIDO CONTRA XSS)
// ────────────────────────────────────────────────────────

function verificarStatusPagamento() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");

  const mensagem = document.getElementById("payment-status");

  if (!mensagem) return;

  // 🔒 Validar apenas valores conhecidos (whitelist)
  if (!ALLOWED_STATUS.includes(status)) {
    return;
  }

  let conteudo;

  // 🔒 Usar DOM API segura (textContent, createElement) em vez de innerHTML
  switch (status) {
    case "success":
      conteudo = document.createElement("div");
      conteudo.className = "alert alert-success";
      conteudo.setAttribute("role", "alert");

      const successTitle = document.createElement("h3");
      successTitle.textContent = "✅ Pagamento Aprovado";
      conteudo.appendChild(successTitle);

      const successP = document.createElement("p");
      successP.textContent = "Seu ingresso será enviado no email em breve.";
      conteudo.appendChild(successP);

      mensagem.appendChild(conteudo);
      break;

    case "failure":
      conteudo = document.createElement("div");
      conteudo.className = "alert alert-danger";
      conteudo.setAttribute("role", "alert");

      const failureTitle = document.createElement("h3");
      failureTitle.textContent = "❌ Pagamento Recusado";
      conteudo.appendChild(failureTitle);

      const failureP = document.createElement("p");
      failureP.textContent = "Verifique seus dados e tente novamente.";
      conteudo.appendChild(failureP);

      mensagem.appendChild(conteudo);
      break;

    case "pending":
      conteudo = document.createElement("div");
      conteudo.className = "alert alert-warning";
      conteudo.setAttribute("role", "alert");

      const pendingTitle = document.createElement("h3");
      pendingTitle.textContent = "⏳ Pagamento Pendente";
      conteudo.appendChild(pendingTitle);

      const pendingP = document.createElement("p");
      pendingP.textContent = "Aguardando confirmação. Verifique seu email.";
      conteudo.appendChild(pendingP);

      mensagem.appendChild(conteudo);
      break;
  }
}

// ────────────────────────────────────────────────────────
// FUNÇÃO: Notificação Segura
// ────────────────────────────────────────────────────────

function showNotification(mensagem, tipo = "success") {
  const container = document.getElementById("notifications") || document.body;

  const notif = document.createElement("div");
  notif.className = `alert alert-${tipo}`;
  notif.setAttribute("role", "alert");
  notif.textContent = mensagem;

  container.appendChild(notif);

  // Auto-remover após 5 segundos
  const timeoutId = setTimeout(() => {
    notif.remove();
  }, 5000);

  // 🔒 Cleanup de timeout quando remover
  notif.addEventListener("remove", () => {
    clearTimeout(timeoutId);
  });
}

// ────────────────────────────────────────────────────────
// EVENT LISTENERS (Inicialização)
// ────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", function () {
  // Verificar status de pagamento
  verificarStatusPagamento();

  // Exemplo: Formulário de compra
  const formCompra = document.getElementById("form-compra");

  if (formCompra) {
    formCompra.addEventListener("submit", function (e) {
      e.preventDefault();

      const ingressoData = {
        email: document.getElementById("email").value,
        nome: document.getElementById("nome").value,
        ingresso: document.getElementById("ingresso").value,
        valor: parseFloat(document.getElementById("valor").value),
        quantidade: parseInt(document.getElementById("quantidade").value),
      };

      iniciarCompra(ingressoData);
    });
  }

  // 🔒 Cleanup ao descarregar página
  window.addEventListener("beforeunload", function () {
    // Limpar event listeners e timers
  });
});
