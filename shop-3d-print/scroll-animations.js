// Fa apparire con una leggera animazione (fade-in + spostamento verso l'alto)
// ogni elemento con classe "reveal" quando entra nella parte visibile dello schermo.
// Usa IntersectionObserver: leggero, nativo del browser, nessuna libreria esterna.

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("reveal-visible");
        observer.unobserve(entry.target); // l'animazione parte una sola volta
      }
    });
  },
  { threshold: 0.15 } // si attiva quando il 15% dell'elemento è visibile
);

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
