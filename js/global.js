// ═══════════════════════════════════════════════════════════════
// SALA DO BANQUETE - JavaScript Principal
// ═══════════════════════════════════════════════════════════════

const WHATSAPP_NUMBER = "+5527993093644";
const WHATSAPP_MESSAGE = "Olá! Gostaria de mais informações sobre os eventos da Sala do Banquete.";

// ─────────────────────────────────────────────────────────────
// Galeria
// ─────────────────────────────────────────────────────────────

let currentImageIndex = 0;
const images = document.querySelectorAll('.gallery-img');
const dots = document.querySelectorAll('.gallery-dot');

function showImage(index) {
  // Garante que o índice está dentro do intervalo
  currentImageIndex = (index + images.length) % images.length;

  // Atualiza imagens
  images.forEach(img => img.classList.remove('active'));
  images[currentImageIndex].classList.add('active');

  // Atualiza dots
  dots.forEach(dot => dot.classList.remove('active'));
  dots[currentImageIndex].classList.add('active');
}

function nextImage() {
  showImage(currentImageIndex + 1);
}

function previousImage() {
  showImage(currentImageIndex - 1);
}

// Cliques nos dots
dots.forEach((dot, index) => {
  dot.addEventListener('click', () => showImage(index));
});

// Setas do teclado
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') nextImage();
  if (e.key === 'ArrowLeft') previousImage();
});

// ─────────────────────────────────────────────────────────────
// WhatsApp
// ─────────────────────────────────────────────────────────────

function initWhatsApp() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  // Link no card
  const link = document.getElementById('link-whatsapp');
  if (link) link.href = whatsappUrl;

  // Botão flutuante
  const btn = document.createElement('a');
  btn.id = 'btn-whatsapp';
  btn.href = whatsappUrl;
  btn.target = '_blank';
  btn.rel = 'noopener noreferrer';
  btn.innerHTML = '💬';
  btn.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 50px;
    height: 50px;
    background: #25d366;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    text-decoration: none;
    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    transition: transform 0.3s;
    z-index: 999;
  `;
  btn.onmouseover = () => btn.style.transform = 'translateY(-3px)';
  btn.onmouseout = () => btn.style.transform = 'translateY(0)';
  document.body.appendChild(btn);
}

// ─────────────────────────────────────────────────────────────
// Email
// ─────────────────────────────────────────────────────────────

function initEmail() {
  const email = document.getElementById('link-email');
  if (email) {
    email.href = 'mailto:contato@saladobanquete.com';
    email.textContent = 'contato@saladobanquete.com';
  }
}

// ─────────────────────────────────────────────────────────────
// Instagram
// ─────────────────────────────────────────────────────────────

function initInstagram() {
  const link = document.getElementById('link-instagram');
  if (link) {
    link.href = 'https://instagram.com/saladobanquete';
    link.target = '_blank';
    link.textContent = '@saladobanquete';
  }
}

// ─────────────────────────────────────────────────────────────
// Google Maps
// ─────────────────────────────────────────────────────────────

function initMaps() {
  const link = document.getElementById('link-maps');
  if (link) {
    link.href = 'https://maps.google.com/maps?q=R.+Constante+Sodré,+364,+Santa+Lucia,+Vitória,+ES';
    link.target = '_blank';
  }
}

// ─────────────────────────────────────────────────────────────
// Botão Voltar ao Topo
// ─────────────────────────────────────────────────────────────

let topo = document.getElementById('btnTopo');
if (topo) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      topo.style.display = 'flex';
    } else {
      topo.style.display = 'none';
    }
  });

  topo.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ─────────────────────────────────────────────────────────────
// Inicializar
// ─────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initWhatsApp();
  initEmail();
  initInstagram();
  initMaps();
  showImage(0); // Mostra primeira imagem
});
