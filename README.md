# GLO E-Lottery — Ticket Verification App

A working prototype of the Thai Government Lottery Office (GLO) ticket verification and prize-claim flow. A user scans a physical lottery ticket barcode, photographs the front and back, and the app verifies authenticity against a database (barcode match, OCR number match, draw-date check, claim status) before allowing the prize to be collected.

The UI is a pixel-perfect rebuild of the official GLO app design. The barcode scanning and OCR are real (they use the device camera), and the backend is a real REST API backed by a SQL database.

## What's in this repo

```
GLO-Ticket-Verifier/
├── frontend/               The app (single-page, no build step)
│   ├── index.html          Pixel-perfect GLO UI, all 8 screens
│   └── app.js              Scan + OCR + verification logic, API calls
├── backend/                Real REST API + database
│   ├── server.js           Express API (lookup, verify, scans, claims, admin)
│   ├── db/
│   │   ├── schema.sql      Tables: users, tickets, scan_actions, claim_rewards
│   │   ├── seed.js         Loads schema + 5 sample tickets + demo user
│   │   └── db.js           SQLite handle (Node built-in node:sqlite)
│   ├── package.json
│   └── .env.example
├── design-reference/       The 7 official GLO screens used as the spec
├── docs/
│   └── project-brief.md    Full 7-day project brief
├── skill/                  Reusable Cowork skill that regenerates this workflow
├── ROADMAP.md              Phased plan from prototype → production
└── README.md
```

## Run it locally

**Requirements:** Node.js **22.5 or newer** (uses the built-in `node:sqlite` — no native build needed) and a Chromium browser (Chrome/Edge) for real barcode scanning.

```bash
cd backend
npm install          # installs express + cors only
npm run seed         # creates db/glo.db with sample tickets
npm start            # serves API + the app on http://localhost:8080
```

Then open **http://localhost:8080** in Chrome. The camera needs `localhost` or HTTPS — opening `index.html` as a `file://` will block the camera, which is why we serve it through the backend.

> The frontend also runs standalone (double-click `index.html`) using an embedded seed dataset, but the camera and persistence only work when served over `http://localhost`.

## Deploy to Render

This repo includes a Dockerfile and `render.yaml` blueprint for a cloud web service.
Render is a good fit for the prototype because the backend serves both the REST API
and the frontend, and the app needs HTTPS for camera access.

1. Push this repo to GitHub.
2. In Render, choose **New +** -> **Blueprint**.
3. Connect the GitHub repo and select the branch to deploy.
4. Render will read `render.yaml`, build the Docker image, mount a 1 GB disk at
   `/var/data`, seed SQLite on first boot, and expose `/api/health`.

Cloud runtime settings:

```env
GLO_DB_PATH=/var/data/glo.db
GLO_RUNTIME_STATE_PATH=/var/data/runtime-ownership.json
```

The database is created automatically if it does not exist. The mounted disk keeps
claim/ownership state across restarts and deploys.

## How verification works

```
Scan barcode ─► lookup in DB ─► capture front + back ─► OCR reads printed number
     └─► rules engine combines:
          1. barcode exists in database?
          2. OCR number == barcode's registered number?
          3. still within the 2-year claim window (draw date + 2 years)?
          4. already claimed?
          4. (strict) was the photo actually readable? unreadable → review
          5. (AI) does the photo look like a real ticket, not a screenshot/copy?
     └─► result: ok · review · suspicious · expired · claimed · invalid
     └─► if ok + winner ─► claim ─► PIN ─► payout record
```

The same rules run on the client (instant feedback) **and** on the server (`POST /api/verify`), which is the source of truth and writes an audit row to `scan_actions`.

## Real ticket data (21 seeded tickets)

The database is seeded with **21 real GLO tickets**. Each ticket's barcode was decoded
programmatically from the Data Matrix code on the ticket photo (`YY-period-set-NNNNNN-XXXX`,
where `NNNNNN` is the printed 6-digit number). A ticket is matched when the scanner reads
**either** the Data Matrix, the 1D ITF barcode, **or** the 6-digit number (via OCR).

Because the official results for the 1 ก.ค. 2569 draw were not available, the winning
numbers are a realistic **demo set** chosen so every prize tier is represented across the
real tickets:

| Draw result (1 ก.ค. 2569) | Number | Winning tickets | Prize |
|---|---|---|---|
| รางวัลที่ 1 | 039184 | `69-26-13-039184-4358` | ฿6,000,000 |
| เลขหน้า 3 ตัว | 972 / 127 | 972469 (×5), 127911 (×5) | ฿4,000 |
| เลขท้าย 3 ตัว | 807 / 545 | 488807 (×2), 453545 (×2) | ฿4,000 |
| เลขท้าย 2 ตัว | 59 | 568259 (×2) | ฿2,000 |
| — (no prize) | — | 910054, 965884, 357788 | — |

Handy test codes (type as barcode, or scan the real ticket):

| Code | Result |
|---|---|
| `69-26-13-039184-4358` | ✅ 1st prize ฿6,000,000 → claimable |
| `972469` (6-digit) | ✅ เลขหน้า 3 ตัว ฿4,000 |
| `2626130402808908` (ITF) | ✅ same as the 1st-prize ticket |
| `965884` | ✅ genuine, no prize this draw |
| `00000000` | ❌ not found / invalid |

## API reference

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/tickets/:barcode` | Look up one ticket |
| POST | `/api/verify` | Run the full rules engine, log the scan |
| POST | `/api/scans` | Record a scan / save-to-account |
| POST | `/api/claims` | Claim a prize (idempotent-guarded) |
| GET | `/api/scans` | Recent scan history |
| GET | `/api/admin/review` | Flagged / suspicious queue |
| GET | `/api/health` | Liveness + current draw |

See **ROADMAP.md** for the phased plan to a fully production-usable app (real auth, AI vision check, image storage, admin panel, and — only with GLO/bank agreements — real payout).

---
*Prototype for demonstration. It does not legally certify a real GLO ticket or move real money.*
