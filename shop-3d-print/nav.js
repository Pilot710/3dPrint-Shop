// Caricato in tutte le pagine (Home, Prodotti, Contatti) per tenere aggiornato
// il numero nel bottone "Carrello" della navbar, letto da localStorage.
function updateNavCartBadge() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const count = cart.reduce((sum, c) => sum + (c.quantity || 0), 0);
  const el = document.getElementById("nav-cart-count");
  if (el) el.textContent = count;
}
updateNavCartBadge();
window.addEventListener("storage", updateNavCartBadge);
