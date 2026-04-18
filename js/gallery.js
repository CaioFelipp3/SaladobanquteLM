let currentImage = 0;
const images = document.querySelectorAll('.gallery-img');
const dots = document.querySelectorAll('.dot');

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

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
});
