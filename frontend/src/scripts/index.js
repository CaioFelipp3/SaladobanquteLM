// Galeria de fotos (index) - CORRIGIDO

const fotos = document.querySelectorAll(".galeria-foto");
const dotsContainer = document.querySelector(".galeria-dots");
const btnPrev = document.querySelector(".galeria-btn--prev");
const btnNext = document.querySelector(".galeria-btn--next");

if (fotos.length > 0) {
  let indiceAtual = 0;

  // 🔒 Criar dots dinamicamente
  fotos.forEach((foto, index) => {
    const dot = document.createElement("div");
    dot.className = "galeria-dot";
    if (index === 0) dot.classList.add("ativo");
    dot.setAttribute("data-index", index);
    dotsContainer.appendChild(dot);
  });

  // Agora pega os dots que acabamos de criar
  const dots = document.querySelectorAll(".galeria-dot");

  function mostrarFoto(indice) {
    // Remover classe ativa da foto e dot anterior
    fotos[indiceAtual].classList.remove("ativa");
    dots[indiceAtual].classList.remove("ativo");

    // Calcular novo índice com wraparound
    indiceAtual = (indice + fotos.length) % fotos.length;

    // Adicionar classe ativa à nova foto e novo dot
    fotos[indiceAtual].classList.add("ativa");
    dots[indiceAtual].classList.add("ativo");
  }

  // Botão anterior
  if (btnPrev) {
    btnPrev.addEventListener("click", function () {
      mostrarFoto(indiceAtual - 1);
    });
  }

  // Botão próximo
  if (btnNext) {
    btnNext.addEventListener("click", function () {
      mostrarFoto(indiceAtual + 1);
    });
  }

  // Dots clicáveis
  dots.forEach(function (dot, i) {
    dot.addEventListener("click", function () {
      mostrarFoto(i);
    });
  });

  // 🔒 Navegação com setas do teclado
  document.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      mostrarFoto(indiceAtual - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      mostrarFoto(indiceAtual + 1);
    }
  });
}
