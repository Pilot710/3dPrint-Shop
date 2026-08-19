let cart = JSON.parse(localStorage.getItem("cart") || "[]");
let products = [];

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
}

// Restituisce prezzo/immagine effettivi tenendo conto della variante scelta (se presente)
function getEffectivePriceAndImage(product, variantId) {
  if (product.varianti && product.varianti.length > 0) {
    const variante = product.varianti.find((v) => v.id === variantId) || product.varianti[0];
    return {
      prezzo: typeof variante.prezzo === "number" ? variante.prezzo : product.prezzo,
      immagine: variante.immagine || product.immagine,
      nomeVariante: variante.nome,
    };
  }
  return { prezzo: product.prezzo, immagine: product.immagine, nomeVariante: null };
}

function addToCart(id) {
  const product = products.find((p) => p.id === id);
  let variantId = null;

  if (product.varianti && product.varianti.length > 0) {
    const select = document.getElementById(`variant-${id}`);
    variantId = select ? select.value : product.varianti[0].id;
  }

  // Un prodotto+variante uguali si sommano in quantita', altrimenti sono righe separate
  const item = cart.find((c) => c.id === id && c.variantId === variantId);
  if (item) item.quantity += 1;
  else cart.push({ id, variantId, quantity: 1 });
  saveCart();
}

function removeFromCart(id, variantId) {
  cart = cart.filter((c) => !(c.id === id && c.variantId === variantId));
  saveCart();
}

async function loadProducts() {
  const res = await fetch("/api/products");
  products = await res.json();
  renderProducts();
  renderCart();
}

function renderProducts() {
  const grid = document.getElementById("product-grid");
  grid.innerHTML = products
    .map((p) => {
      const haVarianti = p.varianti && p.varianti.length > 0;
      const disponibili = haVarianti ? p.varianti.filter((v) => v.disponibile) : [];

      const variantSelect = haVarianti
        ? `<select id="variant-${p.id}" class="variant-select" onchange="updatePriceDisplay('${p.id}')">
            ${disponibili
              .map((v) => `<option value="${v.id}">${v.nome}</option>`)
              .join("")}
          </select>`
        : "";

      const prezzoIniziale = haVarianti
        ? getEffectivePriceAndImage(p, disponibili[0]?.id).prezzo
        : p.prezzo;

      return `
    <div class="product-card">
      <img id="img-${p.id}" src="${p.immagine}" alt="${p.nome}" onerror="this.src='https://via.placeholder.com/300x300?text=Foto'" />
      <div class="product-info">
        <h3>${p.nome}</h3>
        <p>${p.descrizione}</p>
        ${variantSelect}
        <span class="product-price" id="price-${p.id}">€${prezzoIniziale.toFixed(2)}</span>
        <button class="add-btn" onclick="addToCart('${p.id}')">Aggiungi al carrello</button>
      </div>
    </div>`;
    })
    .join("");
}

// Aggiorna prezzo e foto mostrati quando l'utente cambia modello dal menu a tendina
function updatePriceDisplay(id) {
  const product = products.find((p) => p.id === id);
  const select = document.getElementById(`variant-${id}`);
  const { prezzo, immagine } = getEffectivePriceAndImage(product, select.value);
  document.getElementById(`price-${id}`).textContent = `€${prezzo.toFixed(2)}`;
  document.getElementById(`img-${id}`).src = immagine;
}

function renderCart() {
  const itemsEl = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  const countEl = document.getElementById("cart-count");

  let total = 0;
  let count = 0;

  itemsEl.innerHTML = cart
    .map((c) => {
      const product = products.find((p) => p.id === c.id);
      if (!product) return "";
      const { prezzo, nomeVariante } = getEffectivePriceAndImage(product, c.variantId);
      total += prezzo * c.quantity;
      count += c.quantity;
      const etichetta = nomeVariante ? `${product.nome} (${nomeVariante})` : product.nome;
      return `
      <div class="cart-item">
        <span>${etichetta} x${c.quantity}</span>
        <button onclick="removeFromCart('${c.id}', ${c.variantId ? `'${c.variantId}'` : "null"})">Rimuovi</button>
      </div>`;
    })
    .join("");

  totalEl.textContent = `€${total.toFixed(2)}`;
  countEl.textContent = count;
}

document.getElementById("cart-toggle").addEventListener("click", () => {
  document.getElementById("cart-drawer").classList.remove("hidden");
});
document.getElementById("cart-close").addEventListener("click", () => {
  document.getElementById("cart-drawer").classList.add("hidden");
});

document.getElementById("checkout-btn").addEventListener("click", async () => {
  const errorEl = document.getElementById("checkout-error");
  errorEl.textContent = "";

  if (cart.length === 0) {
    errorEl.textContent = "Il carrello è vuoto.";
    return;
  }

  try {
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      errorEl.textContent = data.error || "Errore durante il checkout.";
    }
  } catch (err) {
    errorEl.textContent = "Errore di connessione. Riprova.";
  }
});

loadProducts();
