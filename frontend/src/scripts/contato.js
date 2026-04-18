// contato.js — Dados de contato da Sala do Banquete

// Configurações de contato
const INSTAGRAM_URL = "https://www.instagram.com/saladobanquete.lm/";
const EMAIL_ADDRESS = "saladobanquete.lm@gmail.com";

/**
 * Inicializa o link do Instagram
 */
function initInstagramLink() {
  const instagramLink = document.getElementById("link-instagram");
  if (!instagramLink || !INSTAGRAM_URL.startsWith("https://")) return;

  instagramLink.setAttribute("href", INSTAGRAM_URL);
  const handle = INSTAGRAM_URL.replace(/\/$/, "").split("/").pop();
  instagramLink.textContent = "@" + handle;
}

/**
 * Obtém o valor de um cookie
 */
function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? match[1] : null;
}

/**
 * Define um cookie
 */
function setCookie(name, value) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax; Secure`;
}

/**
 * Abre o cliente de e-mail selecionado
 */
function openEmailClient(client) {
  const encodedEmail = encodeURIComponent(EMAIL_ADDRESS);
  const urls = {
    gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedEmail}`,
    outlook: `https://outlook.live.com/mail/0/deeplink/compose?to=${encodedEmail}`,
    yahoo: `https://compose.mail.yahoo.com/?to=${encodedEmail}`,
    default: `mailto:${EMAIL_ADDRESS}`,
  };

  const url = urls[client] || urls.default;
  const link = document.createElement("a");
  link.href = url;

  if (client !== "default") {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("referrerpolicy", "no-referrer");
  }

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Inicializa a funcionalidade de e-mail com picker de cliente
 */
function initEmailPicker() {
  if (!EMAIL_ADDRESS) return;

  const emailLink = document.getElementById("link-email");
  const changeBtn = document.getElementById("email-trocar");
  const picker = document.getElementById("email-picker");

  if (emailLink) {
    emailLink.textContent = EMAIL_ADDRESS;
    emailLink.setAttribute("href", "#");
    emailLink.addEventListener("click", (e) => {
      e.preventDefault();
      const savedClient = getCookie("mailclient");
      if (savedClient && ["gmail", "outlook", "yahoo", "default"].includes(savedClient)) {
        openEmailClient(savedClient);
      } else if (picker) {
        picker.hidden = false;
      }
    });
  }

  if (changeBtn) {
    if (getCookie("mailclient")) changeBtn.hidden = false;
    changeBtn.addEventListener("click", () => {
      if (picker) picker.hidden = false;
    });
  }

  if (picker) {
    picker.querySelectorAll("button[data-mailclient]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const client = btn.getAttribute("data-mailclient");
        setCookie("mailclient", client);
        picker.hidden = true;
        if (changeBtn) changeBtn.hidden = false;
        openEmailClient(client);
      });
    });
  }
}

/**
 * Inicializa os links do Google Maps
 */
function initMapsLinks() {
  setTimeout(() => {
    const links = [
      document.getElementById("link-maps"),
      document.getElementById("link-maps-index"),
    ];

    links.forEach((link) => {
      if (!link) return;

      const address = link.textContent.trim();
      if (address) {
        const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(address)}`;
        link.setAttribute("href", mapsUrl);
      }
    });
  }, 100); // Aguarda inter.js preencher os dados
}

// Inicialização
initInstagramLink();
initEmailPicker();
initMapsLinks();
