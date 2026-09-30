# Aşkım · أشكم — Interactive Dining Platform

A luxury, trilingual (Arabic RTL · Turkish · English) dining platform for **Aşkım**: a guest menu, a shared live table, one-tap service and an owner control room.
Built by **Solunera**.

---

## What's inside

### Guest experience (`/ar`, `/tr`, `/en`)
| Feature | What it does |
|---|---|
| **Three full languages** | Arabic (RTL), Turkish and English: every dish, description, button and message. The language is picked automatically from the phone and can be switched any time. |
| **Cinematic menu** | All sections and 270 dishes with photos, in Arabic calligraphy and Latin serif, animated hero, section banners, search and filters. |
| **Time-aware ordering** | Breakfast and coffee come first in the morning. Grills, shisha and desserts lead at night (Damascus time). |
| **أشكم Oracle** | The guest picks a mood, party size, budget and preferences, and the Oracle builds a balanced table (mezza, mains, drinks, dessert) within budget. Everything can be added in one tap. |
| **Stories mode** | A full-screen, swipeable reel of signature dishes, like Instagram stories. |
| **Shared live table** | Everyone who scans the table's QR code joins one table and sees each other's picks live. They send one order, and the bill **splits by guest** automatically. |
| **Live order tracking** | Received → Preparing → Ready → Served, updated on the guest's phone. |
| **One-tap service** | Call the waiter, ask for the bill, water, napkins, clearing the table, or **fresh coal for the shisha**. |
| **“Send with love” 🌹** | Send a dessert or drink to another table with a note, anonymous or signed. Staff approve it, the kitchen prepares it, and the other table gets a full-screen moment with falling petals. It's billed to the sender. |
| **Currency lens** | New SYP, old SYP, USD, EUR, TRY and AED. The owner sets the rates. |
| **Pairings & social proof** | "Pairs beautifully with…" suggestions and "Ordered 12× today" badges. |
| **Feedback** | Star ratings and comments, which show up in Insights. |

### Control room (`/admin`)
| Page | What it does |
|---|---|
| **Live floor** | Floor map by zone showing free, seated, ordering and needs-attention tables. KPIs, a live request queue, gift approvals, a per-table drawer and a close-table button. Plays a chime on anything new. |
| **Kitchen** | Kanban board (New → Preparing → Ready) with notes, gift flags, late-order highlighting and full-screen mode for a kitchen TV. |
| **Menu** | Edit prices inline, toggle sold-out and signature, full item editor (AR/TR/EN), and a **bulk price update** (± %, rounded, previewed before applying). |
| **Tables & QR** | Printable table cards with each table's QR code, adding tables, regenerating codes, and opening any table as a guest. |
| **Insights** | Revenue by day, an hour × weekday heatmap, best sellers, revenue by section, **“looked at, rarely ordered”** dishes (views vs orders) and guest reviews. |
| **Settings** | Exchange rates, service charge, order and gift switches, brand and social links. |

---

## Tech
- **Next.js 16** (App Router, React 19) + **TypeScript**
- **PostgreSQL** + **Drizzle ORM**
- **Tailwind CSS 4**, self-hosted fonts (Aref Ruqaa, Cormorant Garamond, IBM Plex Sans Arabic, Manrope)
- No external services are needed. Live sync uses lightweight polling, so it works on any host.

## Run it locally
```bash
npm install
cp .env.example .env          # set DATABASE_URL + ADMIN_PASSWORD
npm run setup                 # creates tables + seeds the full menu, 28 tables and demo activity
npm run dev
```
- Guest menu: http://localhost:3000 (`/ar`, `/tr`, `/en`)
- Seat yourself at table 7 (pitch shortcut): http://localhost:3000/demo
- Control room: http://localhost:3000/admin (password from `.env`, default `askim2026`)

Seed without demo analytics: `npm run db:seed -- --no-demo`

No Postgres installed? Quickest option:
```bash
docker run -d --name askim-db -e POSTGRES_USER=askim -e POSTGRES_PASSWORD=askim -e POSTGRES_DB=askim -p 5432:5432 postgres:16
```

### Photos
By default, photos load from the restaurant's current eMenu CDN. To self-host them (recommended before switching the restaurant over):
```bash
npm run images:pull           # downloads every photo into public/media
# then in .env:
NEXT_PUBLIC_MEDIA_BASE="/media"
```

## Deploy
Any Node host plus PostgreSQL works, e.g. **Vercel + Neon** or a VPS.
1. Create a Postgres database and set `DATABASE_URL`, `ADMIN_PASSWORD`, `AUTH_SECRET` and `NEXT_PUBLIC_BASE_URL` (your domain, used in the QR codes).
2. `npm run db:push && npm run db:seed -- --no-demo`
3. `npm run build && npm start`
4. Print the table cards from **/admin/tables**.

## Pitch script (5 minutes)
1. Hand the owner a phone at **/demo**. He enters his name and he's at table 7.
2. Open a second phone at the same table. Items added on one appear on the other.
3. Open the **Oracle**: "Feast · 4 people · budget", then add all.
4. Open **/admin** on a laptop. Tap **Fresh coal** on the phone and the request pops up on the floor with a chime.
5. From another table (open `/admin/tables` → Open), **send a kunafa with a note** to table 7. Approve it in the admin, and the petals land on the phone.
6. Finish on **Insights → “Looked at, rarely ordered”**. This is money the current menu can't show him.

---
© Solunera · @soluneragency
