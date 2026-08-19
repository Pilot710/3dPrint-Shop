# Guida completa: negozio online stampe 3D + Instagram

Sito con catalogo prodotti, carrello e pagamento diretto con carta (Stripe). Gratuito nei costi fissi: paghi solo una piccola commissione a Stripe per transazione andata a buon fine (circa 1.5% + €0.25 per pagamenti europei — verifica il tasso aggiornato sul sito Stripe).

---

## Passo 1 — Crea il repository GitHub

Come per l'altro progetto: crea un repository (es. `shop-3d-print`) su [github.com](https://github.com) e carica tutti questi file.

## Passo 2 — Crea l'account Stripe

1. Vai su [stripe.com](https://stripe.com) → registrati (serve partita IVA per operare in modalità "live"; in modalità test puoi provare tutto gratis prima)
2. Vai su **Developers → API keys**: copia la **Secret key** → sarà la tua `STRIPE_SECRET_KEY`
   - Usa la chiave che inizia con `sk_test_` finché testi, poi passa a `sk_live_` quando sei pronto a vendere davvero
3. Attiva i pagamenti: Stripe ti chiederà dati aziendali e conto corrente per ricevere gli incassi (bonifici automatici periodici)

## Passo 3 — Carica le foto dei prodotti

Nella cartella `public/images/`, aggiungi le foto dei tuoi pezzi stampati (formato .jpg o .png, meglio se quadrate, es. 800x800px).

## Passo 4 — Compila il catalogo

Apri `data/products.json` e modifica/aggiungi una voce per ogni prodotto:
```json
{
  "id": "nome-univoco-prodotto",
  "nome": "Nome visibile ai clienti",
  "descrizione": "Breve descrizione",
  "prezzo": 15.00,
  "immagine": "/images/nome-file.jpg",
  "disponibile": true
}
```
Metti `"disponibile": false` per nascondere temporaneamente un pezzo esaurito senza cancellarlo.

### Prodotto con più modelli/varianti (es. porta accendino modello 1, 2, 3)

Se un prodotto ha più modelli/design tra cui scegliere, aggiungi un array `varianti` dentro il prodotto:

```json
{
  "id": "porta-accendino",
  "nome": "Porta accendino",
  "descrizione": "Disponibile in più modelli.",
  "prezzo": 6.00,
  "immagine": "/images/porta-accendino-1.jpg",
  "disponibile": true,
  "varianti": [
    { "id": "modello-1", "nome": "Modello 1 - Classico", "immagine": "/images/porta-accendino-1.jpg", "disponibile": true },
    { "id": "modello-2", "nome": "Modello 2 - Teschio", "immagine": "/images/porta-accendino-2.jpg", "disponibile": true },
    { "id": "modello-3", "nome": "Modello 3 - Robot", "prezzo": 7.50, "immagine": "/images/porta-accendino-3.jpg", "disponibile": true }
  ]
}
```

Note:
- `prezzo` e `immagine` dentro una variante sono **opzionali**: se non li metti, la variante usa il prezzo/foto del prodotto principale. Mettili solo se quel modello specifico costa di più o ha una foto diversa (come "Modello 3" nell'esempio, che costa €7.50 invece di €6.00).
- Sul sito comparirà automaticamente un menu a tendina per scegliere il modello, con prezzo e foto che si aggiornano in base alla scelta.
- Per nascondere un solo modello esaurito (senza toccare gli altri), metti `"disponibile": false` sulla singola variante, non sul prodotto intero.
- Il carrello e il checkout tengono traccia sia del prodotto che del modello scelto, quindi in cassa vedrai esattamente "Porta accendino (Modello 2 - Teschio)".

## Passo 5 — Deploy su Vercel

1. Vai su [vercel.com](https://vercel.com) → **Add New → Project** → seleziona il repository `shop-3d-print`
2. Prima del deploy, in **Environment Variables** aggiungi:

| Nome | Valore |
|---|---|
| `STRIPE_SECRET_KEY` | quella del Passo 2 |
| `PUBLIC_URL` | (lo saprai solo dopo il primo deploy — vedi nota sotto) |
| `TELEGRAM_BOT_TOKEN` | opzionale, se vuoi notifica ordini su Telegram |
| `TELEGRAM_CHAT_ID` | opzionale, come sopra |

3. Premi **Deploy**. Vercel ti darà un URL tipo `https://shop-3d-print-xxxx.vercel.app`
4. Torna in **Settings → Environment Variables**, imposta `PUBLIC_URL` con l'URL appena ottenuto, poi fai **Redeploy** (Deployments → tre puntini → Redeploy)

## Passo 6 — Attiva le notifiche ordine (opzionale)

Per sapere subito quando arriva un ordine (anche su Telegram, come nell'altro progetto):

1. Su Stripe: **Developers → Webhooks → Add endpoint**
2. URL endpoint: `https://tuo-negozio.vercel.app/api/stripe-webhook`
3. Evento da ascoltare: `checkout.session.completed`
4. Copia il **Signing secret** mostrato (`whsec_...`) → aggiungilo su Vercel come `STRIPE_WEBHOOK_SECRET`, poi fai Redeploy

Se hai già un bot Telegram dall'altro progetto, puoi riusare lo stesso `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID`.

## Passo 7 — Collega Instagram

Due modi, anche insieme:

**A. Link semplice in bio (immediato, gratis)**
Vai sul tuo profilo Instagram → Modifica profilo → Sito web → incolla l'URL Vercel. Ogni post/reel dei tuoi pezzi rimanda al negozio.

**B. Instagram/Facebook Shop (i post diventano taggabili con prezzo)**
Richiede:
1. Un account Instagram **Business** collegato a una **Pagina Facebook**
2. Un **catalogo prodotti** su [Meta Commerce Manager](https://business.facebook.com/commerce) — puoi crearlo manualmente (pochi prodotti, va bene per il tuo caso) inserendo nome, foto, prezzo e **link diretto al prodotto sul tuo sito** per ciascun pezzo
3. Una volta approvato il catalogo (di solito qualche giorno), puoi taggare i prodotti nei post/reel: il cliente tocca il tag → vede prezzo → tocca "Vai al sito" → arriva sul tuo negozio → acquista

Nota: l'acquisto avviene comunque sul tuo sito (checkout Stripe), Instagram serve solo da vetrina taggata — è l'opzione più semplice da mantenere con un catalogo piccolo come il tuo.

---

## Struttura del progetto

```
shop-3d-print/
├── GUIDA.md
├── package.json
├── vercel.json
├── .env.example
├── data/
│   └── products.json         ← unico file da modificare per aggiungere/togliere prodotti
├── public/
│   ├── index.html             ← pagina negozio (catalogo + carrello)
│   ├── success.html           ← pagina dopo pagamento riuscito
│   ├── cancel.html            ← pagina se il cliente annulla
│   ├── style.css
│   ├── app.js                 ← logica carrello + checkout
│   └── images/                ← foto dei prodotti
└── api/
    ├── products.js            ← espone il catalogo al sito
    ├── create-checkout-session.js  ← crea il pagamento Stripe
    └── stripe-webhook.js      ← notifica ordine (Telegram opzionale)
```

## Sicurezza pagamenti

I prezzi mostrati al checkout vengono **sempre ricalcolati lato server** da `data/products.json`, non da quello che manda il browser — così nessuno può alterare il prezzo dal client. Il numero di carta non passa mai dal tuo sito: Stripe gestisce l'intero pagamento sulla sua pagina sicura (conformità PCI a carico loro).

## Costi

- **GitHub + Vercel**: gratis
- **Stripe**: nessun costo fisso, solo commissione per transazione riuscita (circa 1.5%+€0.25 per carte europee — verifica il tasso attuale su stripe.com/it/pricing)
- **Instagram Shopping**: gratis
