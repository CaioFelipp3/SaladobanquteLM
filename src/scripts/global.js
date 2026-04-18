// Configurações globais
const WHATSAPP_NUMBER = "+5527993093644";
const WHATSAPP_MESSAGE = "Olá! Gostaria de mais informações sobre os eventos da Sala do Banquete.";
const SCROLL_THRESHOLD_HIDE_NAV = 60;
const SCROLL_THRESHOLD_SHOW_TOP_BTN = 300;
const INTERSECTION_THRESHOLD = 0.15;
const NAV_AUTO_CLOSE_DELAY = 2000;
const MOBILE_BREAKPOINT = 1080;

/**
 * Redireciona para HTTPS em produção
 */
function initHttpsRedirect() {
  const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(location.hostname);
  if (location.protocol !== "https:" && !isLocalhost) {
    location.replace("https:" + location.href.substring(location.protocol.length));
  }
}

/**
 * Desabilita localStorage e sessionStorage por segurança
 */
function disableStorage() {
  try {
    Object.defineProperty(window, "localStorage", { get: () => undefined });
    Object.defineProperty(window, "sessionStorage", { get: () => undefined });
  } catch (error) {
    // Ignora erros se não conseguir desabilitar
  }
}

/**
 * Inicializa funcionalidades do WhatsApp (botão flutuante e link no card)
 */
function initWhatsApp() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.trim()}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  // Atualiza link no card de contato
  const whatsappCardLink = document.getElementById("link-whatsapp");
  if (whatsappCardLink) {
    whatsappCardLink.setAttribute("href", whatsappUrl);
  }

  // Cria botão flutuante
  const whatsappBtn = document.createElement("a");
  whatsappBtn.id = "btn-whatsapp";
  whatsappBtn.setAttribute("href", whatsappUrl);
  whatsappBtn.setAttribute("target", "_blank");
  whatsappBtn.setAttribute("rel", "noopener noreferrer");
  whatsappBtn.setAttribute("referrerpolicy", "no-referrer");
  whatsappBtn.setAttribute("aria-label", "Falar pelo WhatsApp");
  whatsappBtn.setAttribute("data-i18n-aria", "btn.whatsapp");
  whatsappBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;
  document.body.appendChild(whatsappBtn);
}

/**
 * Inicializa o comportamento de scroll da navegação superior
 */
function initNavScroll() {
  const navTop = document.getElementById("nav-topo");
  if (!navTop) return;

  let previousScroll = 0;
  window.addEventListener("scroll", () => {
    const currentScroll = window.scrollY;
    if (currentScroll > previousScroll && currentScroll > SCROLL_THRESHOLD_HIDE_NAV) {
      navTop.classList.add("oculto");
    } else {
      navTop.classList.remove("oculto");
    }
    previousScroll = currentScroll;
  }, { passive: true });
}

/**
 * Inicializa o botão "Voltar ao Topo"
 */
function initBackToTop() {
  const backToTopBtn = document.getElementById("btnTopo");
  if (!backToTopBtn) return;

  window.addEventListener("scroll", () => {
    backToTopBtn.style.display = window.scrollY > SCROLL_THRESHOLD_SHOW_TOP_BTN ? "flex" : "none";
  }, { passive: true });

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/**
 * Define o ano atual no rodapé
 */
function setCurrentYear() {
  const yearElement = document.getElementById("ano-atual");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

/**
 * Inicializa o efeito de revelação ao scroll
 */
function initScrollReveal() {
  const revealElements = document.querySelectorAll(
    ".secao h1, .secao h2, .secao h3, .secao p, .secao > img, .secao .video, .galeria-container, .galeria-dots"
  );

  revealElements.forEach(el => el.classList.add("reveal"));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visivel");
      } else if (entry.boundingClientRect.top > 0) {
        entry.target.classList.remove("visivel");
      }
    });
  }, { threshold: INTERSECTION_THRESHOLD });

  revealElements.forEach(el => observer.observe(el));
}

/**
 * Cria SVG do chevron para o botão de toggle da navegação lateral
 */
function createChevronSvg(direction) {
  const points = direction === "right" ? "9 18 15 12 9 6" : "15 18 9 12 15 6";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="12" height="12" aria-hidden="true"><polyline points="${points}"></polyline></svg>`;
}

/**
 * Inicializa a navegação lateral com destaque da seção ativa e toggle mobile
 */
function initNavLateral() {
  const navLateral = document.getElementById("nav-lateral");
  const navLateralItems = document.querySelectorAll("#nav-lateral li");

  if (navLateralItems.length === 0) return;

  const pageSections = document.querySelectorAll(".secao");

  function updateActiveNavItem() {
    let currentSectionId = "";
    pageSections.forEach((section) => {
      if (section.getBoundingClientRect().top <= 110) {
        currentSectionId = section.id;
      }
    });
    navLateralItems.forEach((item) => {
      item.classList.remove("ativo");
      const link = item.querySelector("a");
      if (link && link.getAttribute("href") === "#" + currentSectionId) {
        item.classList.add("ativo");
      }
    });
  }

  window.addEventListener("scroll", updateActiveNavItem, { passive: true });
  updateActiveNavItem();

  if (!navLateral) return;

  // Cria botão de toggle para mobile
  const toggleBtn = document.createElement("button");
  toggleBtn.id = "nav-lateral-toggle";
  toggleBtn.setAttribute("aria-label", "Navegar seções");
  toggleBtn.setAttribute("aria-expanded", "false");
  toggleBtn.innerHTML = createChevronSvg("right");
  document.body.appendChild(toggleBtn);

  let isNavOpen = false;
  let isManuallyOpened = false;
  let isManuallyClosed = false;
  let scrollTimer;

  function openNav() {
    navLateral.classList.add("visivel");
    toggleBtn.innerHTML = createChevronSvg("left");
    toggleBtn.setAttribute("aria-expanded", "true");
    isNavOpen = true;
  }

  function closeNav(byTimer = false) {
    navLateral.classList.remove("visivel");
    toggleBtn.innerHTML = createChevronSvg("right");
    toggleBtn.setAttribute("aria-expanded", "false");
    isNavOpen = false;
    isManuallyOpened = false;
    if (byTimer) {
      isManuallyClosed = false;
    } else {
      isManuallyClosed = true;
    }
  }

  toggleBtn.addEventListener("click", () => {
    if (isNavOpen) {
      closeNav(false);
    } else {
      isManuallyClosed = false;
      openNav();
      isManuallyOpened = true;
    }
  });

  // Fecha nav ao clicar em link (mobile)
  navLateral.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= MOBILE_BREAKPOINT) {
        closeNav(false);
      }
    });
  });

  // Auto-abre/fecha nav no scroll (mobile)
  window.addEventListener("scroll", () => {
    if (window.innerWidth <= MOBILE_BREAKPOINT && !isManuallyOpened) {
      if (!isNavOpen && !isManuallyClosed) openNav();
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => closeNav(true), NAV_AUTO_CLOSE_DELAY);
    }
  }, { passive: true });
}

// Inicialização
initHttpsRedirect();
disableStorage();
initWhatsApp();
initNavScroll();
initBackToTop();
setCurrentYear();
initScrollReveal();
initNavLateral();
