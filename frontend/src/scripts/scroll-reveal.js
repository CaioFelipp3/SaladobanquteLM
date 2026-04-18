// scroll-reveal.js — Efeito de revelação ao scrollar

(function () {
  var reveals = document.querySelectorAll(".reveal");

  function mostrarSeVisivel() {
    reveals.forEach(function (element) {
      var rect = element.getBoundingClientRect();
      var isVisible = rect.top < window.innerHeight * 0.85;

      if (isVisible) {
        element.classList.add("visivel");
      }
    });
  }

  // Executa na primeira carga
  mostrarSeVisivel();

  // Executa ao fazer scroll (com throttle para performance)
  var timeout;
  window.addEventListener("scroll", function () {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(mostrarSeVisivel, 10);
  });
})();
