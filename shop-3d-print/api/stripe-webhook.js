const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Necessario per verificare la firma Stripe: serve il corpo grezzo della richiesta,
// quindi disabilitiamo il body parser automatico di Vercel.
module.exports.config = { api: { bodyParser: false } };

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

async function sendTelegram(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "HTML" }),
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  const rawBody = await getRawBody(req);
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error("Firma webhook non valida:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const items = await stripe.checkout.sessions.listLineItems(session.id);

    const dettaglio = items.data
      .map((it) => `• ${it.description} x${it.quantity} — €${(it.amount_total / 100).toFixed(2)}`)
      .join("\n");

    const indirizzo = session.shipping_details
      ? `${session.shipping_details.address.line1}, ${session.shipping_details.address.city} (${session.shipping_details.address.postal_code})`
      : "N/D";

    await sendTelegram(
      `🛒 <b>Nuovo ordine!</b>\n\n${dettaglio}\n\n` +
        `Totale: €${(session.amount_total / 100).toFixed(2)}\n` +
        `Cliente: ${session.customer_details?.email || "N/D"}\n` +
        `Spedizione: ${indirizzo}`
    );
  }

  return res.status(200).json({ received: true });
};
