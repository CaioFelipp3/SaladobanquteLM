// inter — Textos em PT-BR (Liliam Müller – A Sala do Banquete)
// Preencha os valores vazios com os textos reais do projeto.

(function () {
  var t = {
    // ── Navegação Topo ───────────────────────────────────────────────────────
    "nav.home": "Início",
    "nav.sobre": "A Sala do Banquete",
    "nav.eventos": "Eventos",
    "nav.galeria": "Galeria",
    "nav.ingressos": "Ingressos",
    "nav.contato": "Fale Conosco",

    // ── Navegação Lateral (seções do index) ──────────────────────────────────
    "navl.sobre": "A Sala do Banquete",
    "navl.eventos": "Eventos",
    "navl.galeria": "Galeria",
    "navl.contato": "Fale Conosco",

    // ── Rodapé ───────────────────────────────────────────────────────────────
    "footer.copy": "Todos os direitos reservados.",

    // ── Acessibilidade ───────────────────────────────────────────────────────
    "btn.topo": "Voltar ao topo",
    "btn.gal.prev": "Foto anterior",
    "btn.gal.next": "Próxima foto",
    "btn.whatsapp": "Falar pelo WhatsApp",

    // ── Hero ─────────────────────────────────────────────────────────────────
    "hero.titulo": "Uma Experiência Única à Mesa",
    "hero.sub": "Descubra os melhores eventos em Vitória, ES",
    "hero.cta": "Ver próximos eventos",

    // ── Sobre ─────────────────────────────────────────────────────────────────
    "sobre.h2": "A Sala do Banquete",
    "sobre.p0": "A Sala do Banquete é um espaço sofisticado dedicado a criar momentos inesquecíveis. Com uma proposta inovadora que une gastronomia, arte e entretenimento, nos especializamos em eventos memoráveis.",
    "sobre.p1": "Fundada por Liliam Müller, nossa sala se tornou referência em Vitória-ES por oferecer experiências personalizadas, ambientes elegantes e seleção cuidadosa de artistas e produtores. Cada evento é único, refletindo o compromisso com excelência.",

    // ── Eventos ───────────────────────────────────────────────────────────────
    "eventos.h2": "Próximos Eventos",
    "eventos.intro": "Confira nossa programação completa e reserve seus ingressos",

    "evento1.nome": "Noite Especial com Música ao Vivo",
    "evento1.data": "28 de Junho · 19h30",
    "evento1.desc": "Uma noite inesquecível com os melhores artistas locais",
    "evento1.cta": "Adquirir ingresso",

    "evento2.nome": "Chá Musical com Poesia",
    "evento2.data": "12 de Julho · 16h00",
    "evento2.desc": "Experiência única combinando chá, música clássica e poesia",
    "evento2.cta": "Adquirir ingresso",

    // ── Galeria ───────────────────────────────────────────────────────────────
    "galeria.h2": "Nossa Galeria",
    "galeria.p": "Conheça os ambientes elegantes e sofisticados da Sala do Banquete",

    // ── Contato ───────────────────────────────────────────────────────────────
    "contato.h1": "Fale Conosco",
    "contato.h2": "Fale Conosco",
    "contato.intro": "Entre em contato conosco para informações, reservas ou dúvidas sobre nossos eventos"
    "contato.wa": "WhatsApp",
    "contato.wa.link": "Falar pelo WhatsApp",
    "contato.email": "E-mail",
    "contato.ig": "Instagram",
    "contato.end": "Endereço",
    "contato.end.val":
      "R. Constante Sodré, 364 - Santa Lucia, Vitória - ES, 29056-310", // ← Endereço completo

    // ── Página de Ingressos ───────────────────────────────────────────────────
    "ingressos.h1": "Ingressos",
    "ingressos.intro": "", // ← Texto introdutório da página de ingressos
  };

  // ── Títulos de página ─────────────────────────────────────────────────────
  var pageTitles = {
    index: "Liliam Müller – A Sala do Banquete",
    ingressos: "Ingressos – Liliam Müller",
    contato: "Fale Conosco – Liliam Müller",
  };

  // ── Aplica textos ─────────────────────────────────────────────────────────
  function applyTexts() {
    var pageId =
      (document.body && document.body.getAttribute("data-page")) || "";
    if (pageTitles[pageId]) document.title = pageTitles[pageId];

    // data-i18n → textContent
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (t[key] !== undefined && t[key] !== "") el.textContent = t[key];
    });

    // data-i18n-aria → aria-label
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria");
      if (t[key] !== undefined && t[key] !== "")
        el.setAttribute("aria-label", t[key]);
    });

    // Dots da galeria: aria-label numerados
    document.querySelectorAll(".galeria-dot").forEach(function (dot, idx) {
      dot.setAttribute("aria-label", "Foto " + (idx + 1));
    });
  }

  applyTexts();
})();
