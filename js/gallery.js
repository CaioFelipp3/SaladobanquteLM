// ─── Galeria ────────────────────────────────────────────
let currentImage = 0;
const images = document.querySelectorAll('.gallery-img');
const dots = document.querySelectorAll('.dot');
const galleryMain = document.getElementById('galleryMain');

function showImage(index) {
    images.forEach(img => img.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    images[index].classList.add('active');
    dots[index].classList.add('active');
    currentImage = index;
}

function nextImage() {
    showImage((currentImage + 1) % images.length);
}

function prevImage() {
    showImage((currentImage - 1 + images.length) % images.length);
}

// Setas do teclado
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
});

// Swipe touch para mobile
let touchStartX = 0;

galleryMain.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
}, { passive: true });

galleryMain.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
        diff > 0 ? nextImage() : prevImage();
    }
}, { passive: true });

// ─── Menu hamburger ─────────────────────────────────────
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', isOpen);
});

// Fecha o menu ao clicar em um link
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
    });
});

// ─── Botões de ingresso → WhatsApp ──────────────────────
document.querySelectorAll('[data-wa]').forEach(btn => {
    btn.addEventListener('click', () => window.open(btn.dataset.wa, '_blank'));
});

// ─── Aplicar config ─────────────────────────────────────
if (typeof CONFIG !== 'undefined') {
    const wa = `https://wa.me/${CONFIG.whatsappNumber}`;
    document.getElementById('link-whatsapp').href = wa;
    document.getElementById('link-whatsapp-float').href = wa;
    document.getElementById('link-instagram').href = CONFIG.instagramUrl;
    document.getElementById('link-email').href = `mailto:${CONFIG.email}`;
    document.getElementById('link-email').textContent = `📧 ${CONFIG.email}`;
    document.getElementById('link-maps').href = CONFIG.mapsUrl;
}
