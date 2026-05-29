// ─── Frontend: Galeria, Menu e Inicialização ─────────────
// Tudo dentro de IIFE para não poluir o escopo global (window)
(function () {
  "use strict";

  // ─── Galeria ───────────────────────────────────────────
  const galleryMain = document.getElementById("galleryMain");
  const images      = document.querySelectorAll(".gallery-img");
  const dotsWrapper = document.querySelector(".gallery-dots");

  let currentIndex = 0;
  let liveRegion   = null;

  // Gera os dots dinamicamente a partir das imagens.
  // Evita o bug de ter que atualizar HTML e JS manualmente
  // toda vez que uma imagem é adicionada ou removida.
  function initDots() {
    if (!dotsWrapper || images.length === 0) return;

    // Região de anúncio para leitores de tela
    liveRegion = document.createElement("span");
    liveRegion.className = "sr-only";
    liveRegion.setAttribute("aria-live", "polite");
    liveRegion.setAttribute("aria-atomic", "true");
    dotsWrapper.parentElement?.insertBefore(liveRegion, dotsWrapper);

    dotsWrapper.innerHTML = "";
    images.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.className = "dot" + (i === 0 ? " active" : "");
      dot.setAttribute("role", "tab");
      dot.setAttribute("tabindex", "0");
      dot.setAttribute("aria-label", `Foto ${i + 1} de ${images.length}`);
      dot.setAttribute("aria-selected", i === 0 ? "true" : "false");
      dot.addEventListener("click", () => showImage(i));
      dot.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          showImage(i);
        }
      });
      dotsWrapper.appendChild(dot);
    });
  }

  function showImage(index) {
    const dots = dotsWrapper ? dotsWrapper.querySelectorAll(".dot") : [];
    images.forEach((img, i) => img.classList.toggle("active", i === index));
    Array.from(dots).forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
      dot.setAttribute("aria-selected", i === index ? "true" : "false");
    });
    currentIndex = index;

    if (liveRegion) {
      liveRegion.textContent = `Foto ${index + 1} de ${images.length}`;
    }
  }

  function nextImage() {
    showImage((currentIndex + 1) % images.length);
  }

  function prevImage() {
    showImage((currentIndex - 1 + images.length) % images.length);
  }

  // Expõe para os onclick dos botões de controle no HTML
  window.showImage = showImage;
  window.nextImage = nextImage;
  window.prevImage = prevImage;

  // Setas do teclado — ignora quando foco está em campos de texto
  document.addEventListener("keydown", (e) => {
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (e.key === "ArrowRight") nextImage();
    if (e.key === "ArrowLeft")  prevImage();
  });

  // Swipe touch para mobile — guard necessário: galleryMain pode não existir
  if (galleryMain) {
    let touchStartX = 0;

    galleryMain.addEventListener("touchstart", (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    galleryMain.addEventListener("touchend", (e) => {
      const delta = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(delta) > 50) {
        delta > 0 ? nextImage() : prevImage();
      }
    }, { passive: true });
  }

  // ─── Menu hamburger ────────────────────────────────────
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks  = document.querySelector(".nav-links");

  // Guard: elementos podem não existir em outras páginas que usem este script
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      navToggle.classList.toggle("open", isOpen);
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        navToggle.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ─── Botões de ingresso → WhatsApp ────────────────────
  document.querySelectorAll("[data-wa]").forEach((btn) => {
    // noopener,noreferrer: impede que a nova aba acesse window.opener
    btn.addEventListener("click", () =>
      window.open(btn.dataset.wa, "_blank", "noopener,noreferrer")
    );
  });

  // ─── Aplicar config dinâmica (js/config.js) ───────────
  // config.js é ignorado pelo git — contém dados reais (número, links, etc.)
  // Todos os getElementById usam ?. para não quebrar se um elemento for removido
  if (typeof CONFIG !== "undefined") {
    const waBase  = `https://wa.me/${CONFIG.whatsappNumber}`;
    const waFloat = `${waBase}?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20Sala%20do%20Banquete%20e%20gostaria%20de%20saber%20mais%20sobre%20agendas%20dispon%C3%ADveis%2C%20or%C3%A7amentos%20e%20possibilidade%20de%20agendar%20uma%20reuni%C3%A3o.%20Poderia%20me%20ajudar%3F`;
    const el = (id) => document.getElementById(id);

    el("link-whatsapp")?.setAttribute("href", waBase);
    el("link-whatsapp-float")?.setAttribute("href", waFloat);
    el("link-instagram")?.setAttribute("href", CONFIG.instagramUrl);

    const emailLink = el("link-email");
    if (emailLink) {
      emailLink.setAttribute("href", `mailto:${CONFIG.email}`);
      emailLink.textContent = `📧 ${CONFIG.email}`;
    }

    el("link-maps")?.setAttribute("href", CONFIG.mapsUrl);
  }

  // Ano dinâmico no rodapé
  const yearEl = document.getElementById("footer-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Inicializa dots após tudo configurado
  initDots();
})();
