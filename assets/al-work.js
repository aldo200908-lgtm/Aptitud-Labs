/* Aptitud Labs · Animación y respaldo visual de Nuestro trabajo */
(function () {
  "use strict";

  const section = document.getElementById("trabajo-destacado");
  if (!section || section.dataset.alWorkInitialized === "true") return;
  section.dataset.alWorkInitialized = "true";

  // Un fallo de descarga activa el degradado con el nombre y categoría.
  section.querySelectorAll(".al-work-image img").forEach((img) => {
    const container = img.closest(".al-work-image");
    if (!container) return;

    const showFallback = () => {
      img.hidden = true;
      container.classList.add("al-work-image-error");
    };

    img.addEventListener("error", showFallback, { once: true });
    if (img.complete && img.naturalWidth === 0) showFallback();
  });

  const elements = section.querySelectorAll(".al-work-reveal");
  const cards = section.querySelectorAll(".al-work-card");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("al-work-visible"));
    cards.forEach((card) => card.classList.add("al-work-done"));
    return;
  }

  // Restaurar el hover tras concluir la transición de opacidad, sin retrasos.
  cards.forEach((card) => {
    card.addEventListener("transitionend", (event) => {
      if (event.target === card && event.propertyName === "opacity") {
        card.classList.add("al-work-done");
      }
    });
  });

  section.classList.add("al-work-enhanced");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("al-work-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: "0px 0px 40px 0px" });

  elements.forEach((element) => observer.observe(element));
})();
