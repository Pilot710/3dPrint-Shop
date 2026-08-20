const Stripe = require("stripe");
const products = require("../data/products.json");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const PUBLIC_URL = process.env.PUBLIC_URL || "http://localhost:3000";

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Metodo non consentito" });

  try {
    const { cart } = req.body; // [{ id, variantId, quantity }, ...]
    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Carrello vuoto" });
    }

    // IMPORTANTE: i prezzi vengono presi sempre dal catalogo server-side (data/products.json),
    // mai da quello che manda il browser, per evitare che qualcuno manipoli i prezzi dal client.
    // Se il prodotto ha varianti, la variante scelta puo' sovrascrivere nome/prezzo/immagine.
    const line_items = cart.map(({ id, variantId, quantity }) => {
      const product = products.find((p) => p.id === id);
      if (!product || !product.disponibile) {
        throw new Error(`Prodotto non disponibile: ${id}`);
      }

      let nome = product.nome;
      let prezzo = product.prezzo;
      let immagine = product.immagine;

      if (product.varianti && product.varianti.length > 0) {
        const variante = product.varianti.find((v) => v.id === variantId);
        if (!variante || !variante.disponibile) {
          throw new Error(`Variante non disponibile per: ${id}`);
        }
        nome = `${product.nome} — ${variante.nome}`;
        if (typeof variante.prezzo === "number") prezzo = variante.prezzo;
        if (variante.immagine) immagine = variante.immagine;
      }

      return {
        price_data: {
          currency: "eur",
          product_data: {
            name: nome,
            images: [`${PUBLIC_URL}${immagine}`],
          },
          unit_amount: Math.round(prezzo * 100),
        },
        quantity: Math.max(1, Math.min(quantity || 1, 10)),
      };
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      shipping_address_collection: { allowed_countries: ["IT", "CH"] },
      success_url: `${PUBLIC_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${PUBLIC_URL}/cancel.html`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
};
