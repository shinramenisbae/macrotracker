# MacroTracker — Product Requirements Document

## 1. Product Overview

MacroTracker is a personal calorie and macronutrient tracking PWA. Point your phone camera at food, get instant nutritional estimates via AI vision. Scan barcodes for packaged products. See your daily intake on a clean dashboard. No accounts, no social features, no bloat — just fast, personal nutrition tracking.

### Goals

- **Effortless logging:** Photo → nutrition data in one tap
- **Barcode support:** Scan packaged foods, pull data from Open Food Facts
- **Clear dashboard:** Daily calories, protein, carbs, fat at a glance
- **Mobile-first PWA:** Installable, works offline for cached data, feels native
- **Self-hosted:** Runs on Stephen's VPS, no third-party dependencies beyond the AI API

---

## 2. Target User

**Stephen** — single user, personal use. Based in Auckland, NZ. Wants a Cal AI-style tracker without the subscription. Tech-savvy enough to self-host. Cares about speed and simplicity over feature count.

No authentication required. Single-user mode.

---

## 3. Feature List

### MVP (v1.0)

| # | Feature | Priority |
|---|---------|----------|
| 1 | **AI Food Photo Analysis** — Capture/upload photo → AI returns calorie & macro estimates | P0 |
| 2 | **Barcode Scanner** — Scan product barcode → fetch nutrition from Open Food Facts | P0 |
| 3 | **Daily Dashboard** — Today's total calories, protein, carbs, fat with progress rings/bars | P0 |
| 4 | **Food Log** — List of today's logged items with edit/delete | P0 |
| 5 | **Manual Entry** — Add food manually (name, calories, macros) | P0 |
| 6 | **Daily Goals** — Set target calories and macro grams | P1 |
| 7 | **Date Navigation** — View logs for past days | P1 |
| 8 | **PWA Install** — Service worker, manifest, installable on mobile | P1 |
| 9 | **Weight Tracking** — Log daily weight, see weight trend over time, set goal weight | P0 |

### Future (v2.0+)

| Feature | Notes |
|---------|-------|
| Weekly/monthly charts | Recharts line/bar graphs for trends |
| Meal categories | Breakfast, lunch, dinner, snack grouping |
| Favorites/recent foods | Quick-add from history |
| Custom food database | Save custom items for reuse |
| Nutrition detail view | Micronutrients, fiber, sugar breakdown |
| Data export | CSV/JSON export of logs |
| Offline mode | Full offline with sync on reconnect |

---

## 4. Technical Architecture

### Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS + Vite |
| Backend | Node.js 22 + Express 4 + SQLite3 (via better-sqlite3) |
| AI Vision | Anthropic Claude Vision API (claude-sonnet-4-20250514 — fast, capable, cost-effective) |
| Barcode Scanning | html5-qrcode (browser-side) |
| Barcode Lookup | Open Food Facts API (free, no key) |
| Charts | Recharts (future phase) |
| Camera | navigator.mediaDevices.getUserMedia (requires HTTPS) |
| Hosting | VPS 76.13.182.206, nginx reverse proxy, Let's Encrypt SSL |

### Architecture Diagram

```
┌─────────────────────────────────────┐
│         Mobile Browser (PWA)         │
│  React + TypeScript + Tailwind       │
│  Camera capture / Barcode scan       │
└──────────────┬──────────────────────┘
               │ HTTPS
               ▼
┌─────────────────────────────────────┐
│         nginx (reverse proxy)        │
│  SSL termination, static files       │
│  Port 443 → localhost:5010           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Express API Server (:5010)      │
│  /api/analyze  → Claude Vision       │
│  /api/barcode  → Open Food Facts     │
│  /api/entries  → SQLite CRUD         │
│  /api/goals    → SQLite CRUD         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│          SQLite Database             │
│  data/macrotracker.db                │
└─────────────────────────────────────┘
```

### AI Vision Strategy

**Primary:** Anthropic Claude Vision (claude-sonnet-4-20250514)
- Send base64 food photo + structured prompt
- Prompt requests JSON response: `{ name, calories, protein_g, carbs_g, fat_g, serving_size, confidence }`
- Confidence field (low/medium/high) so the user knows when to double-check

**Prompt template:**
```
Analyze this food photo. Estimate the nutritional content for the visible portion/serving.
Return ONLY valid JSON:
{
  "items": [
    {
      "name": "food name",
      "serving_size": "estimated portion description",
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number,
      "confidence": "low|medium|high"
    }
  ]
}
If multiple distinct foods are visible, list each separately.
```

**API Key:** Use `ANTHROPIC_API_KEY` env var (already available on VPS).

---

## 5. API Endpoint Design

### Base URL: `/api`

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| POST | `/api/analyze` | AI food photo analysis | `{ image: base64string }` | `{ items: FoodItem[] }` |
| GET | `/api/barcode/:code` | Lookup barcode via Open Food Facts | — | `{ product: FoodItem }` |
| GET | `/api/entries?date=YYYY-MM-DD` | Get food log for a date | — | `{ entries: Entry[] }` |
| POST | `/api/entries` | Add food entry | `{ name, calories, protein_g, carbs_g, fat_g, serving_size, meal?, image_url? }` | `{ entry: Entry }` |
| PUT | `/api/entries/:id` | Update food entry | Partial `Entry` fields | `{ entry: Entry }` |
| DELETE | `/api/entries/:id` | Delete food entry | — | `{ success: true }` |
| GET | `/api/goals` | Get daily goals | — | `{ goals: Goals }` |
| PUT | `/api/goals` | Update daily goals | `{ calories, protein_g, carbs_g, fat_g }` | `{ goals: Goals }` |
| GET | `/api/summary?date=YYYY-MM-DD` | Get daily totals | — | `{ totals: Totals }` |
| GET | `/api/weight?days=30` | Get weight history | — | `{ entries: WeightEntry[] }` |
| POST | `/api/weight` | Log weight | `{ weight_kg, date?, notes? }` | `{ entry: WeightEntry }` |
| DELETE | `/api/weight/:id` | Delete weight entry | — | `{ success: true }` |

### Error format
```json
{ "error": "Human-readable message", "code": "ERROR_CODE" }
```

---

## 6. Database Schema

### `food_entries`
```sql
CREATE TABLE food_entries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  calories    REAL NOT NULL DEFAULT 0,
  protein_g   REAL NOT NULL DEFAULT 0,
  carbs_g     REAL NOT NULL DEFAULT 0,
  fat_g       REAL NOT NULL DEFAULT 0,
  serving_size TEXT,
  meal        TEXT DEFAULT 'other',  -- breakfast, lunch, dinner, snack, other
  source      TEXT DEFAULT 'manual', -- manual, ai_photo, barcode
  barcode     TEXT,
  image_path  TEXT,
  logged_at   TEXT NOT NULL DEFAULT (datetime('now')),
  date        TEXT NOT NULL DEFAULT (date('now')),  -- YYYY-MM-DD for easy querying
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_entries_date ON food_entries(date);
```

### `daily_goals`
```sql
CREATE TABLE daily_goals (
  id          INTEGER PRIMARY KEY CHECK (id = 1),  -- single row
  calories    REAL NOT NULL DEFAULT 2000,
  protein_g   REAL NOT NULL DEFAULT 150,
  carbs_g     REAL NOT NULL DEFAULT 250,
  fat_g       REAL NOT NULL DEFAULT 65,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO daily_goals (id) VALUES (1);
```

### `weight_log`
```sql
CREATE TABLE weight_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  weight_kg   REAL NOT NULL,
  date        TEXT NOT NULL UNIQUE DEFAULT (date('now')),
  notes       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_weight_date ON weight_log(date);
```

### `barcode_cache`
```sql
CREATE TABLE barcode_cache (
  barcode     TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  calories    REAL,
  protein_g   REAL,
  carbs_g     REAL,
  fat_g       REAL,
  serving_size TEXT,
  raw_json    TEXT,
  cached_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

## 7. UI/UX Screen Descriptions

### Design Principles
- Mobile-first: 375px–428px primary viewport
- Dark theme (easier on eyes for daily use, looks sharp)
- Large touch targets (min 44px)
- Bottom navigation bar (thumb-friendly)
- Minimal chrome, maximum content

### 7.1 Dashboard (Home)

The default screen. Shows today's nutrition at a glance.

```
┌─────────────────────────────┐
│  MacroTracker    [date nav] │
│                              │
│  ┌─────────────────────┐    │
│  │   1,247 / 2,000     │    │
│  │   ████████░░░ 62%   │    │
│  │   calories           │    │
│  └─────────────────────┘    │
│                              │
│  P: 87/150g  C: 134/250g   │
│  ██████░░░   ████████░░    │
│                              │
│  F: 45/65g                  │
│  ██████████░                │
│                              │
│  ── Today's Log ──────────  │
│  🍳 Scrambled eggs  320cal  │
│  🥪 Turkey sandwich 487cal  │
│  🍌 Banana          105cal  │
│  🥛 Protein shake   335cal  │
│                              │
│  [📷 Camera] [＋ Add Food]  │
│                              │
├─────────────────────────────┤
│ 🏠 Home 📷 Scan ⚖️ Weight 📊 History│
└─────────────────────────────┘
```

**Elements:**
- Calorie ring/progress bar (prominent, center)
- Three macro progress bars (protein, carbs, fat) with current/goal
- Scrollable food log for the day
- Floating action button or prominent "Add" buttons
- Date picker to navigate days (swipe or arrows)

### 7.2 Camera / Scan Screen

Accessed from bottom nav or FAB. Two modes: Photo and Barcode.

```
┌─────────────────────────────┐
│  [Photo]  [Barcode]  tabs   │
│                              │
│  ┌─────────────────────┐    │
│  │                     │    │
│  │    Camera Preview   │    │
│  │                     │    │
│  │                     │    │
│  └─────────────────────┘    │
│                              │
│       [ 📷 Capture ]        │
│    or [ 📁 From Gallery ]   │
│                              │
│  ── Results ──────────────  │
│  (appears after analysis)    │
│  Grilled Chicken Salad      │
│  Cal: 380  P: 35g           │
│  C: 18g   F: 19g            │
│  Confidence: High ✅         │
│                              │
│  [✓ Log This] [✏️ Edit]     │
└─────────────────────────────┘
```

**Photo mode:**
- Live camera preview (rear-facing default)
- Capture button + gallery upload option
- Loading spinner during AI analysis
- Results card with nutrition breakdown
- One-tap "Log This" to add to today's log
- Edit option to adjust values before logging

**Barcode mode:**
- Camera preview with scan region overlay
- Auto-detect barcode, show product info
- If not found in Open Food Facts, offer manual entry
- One-tap log after scan

### 7.3 History Screen

View past days' logs and totals.

```
┌─────────────────────────────┐
│  History                     │
│                              │
│  ◀ April 2026 ▶             │
│  [calendar grid / list]      │
│                              │
│  Apr 2 — 1,890 cal ✅       │
│  Apr 1 — 2,340 cal ⚠️       │
│  Mar 31 — 1,650 cal ✅      │
│  Mar 30 — 2,100 cal ✅      │
│                              │
│  Tap a day to see details    │
└─────────────────────────────┘
```

- List of recent days with total calories
- Green check if within goal, warning if over
- Tap to expand and see full log for that day
- Future: weekly/monthly chart view (Recharts)

### 7.4 Food Detail / Edit

Shown when tapping a logged item or editing AI results.

```
┌─────────────────────────────┐
│  ← Food Detail               │
│                              │
│  [food photo if available]   │
│                              │
│  Grilled Chicken Salad      │
│  Source: AI Photo 📷         │
│  Logged: 12:34 PM           │
│                              │
│  Calories  [  380  ]        │
│  Protein   [  35   ] g      │
│  Carbs     [  18   ] g      │
│  Fat       [  19   ] g      │
│  Serving   [1 plate]        │
│                              │
│  [💾 Save]  [🗑️ Delete]     │
└─────────────────────────────┘
```

- Editable number fields for all macros
- Photo thumbnail if captured via camera
- Source indicator (AI, barcode, manual)
- Save and delete actions

---

## 8. File/Folder Structure

```
macrotracker/
├── package.json              # Root package.json (workspaces)
├── README.md
│
├── client/                   # Frontend (React + Vite)
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   ├── public/
│   │   ├── manifest.json     # PWA manifest
│   │   ├── sw.js             # Service worker
│   │   ├── icons/            # PWA icons (192, 512)
│   │   └── favicon.ico
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css          # Tailwind imports
│       ├── components/
│       │   ├── Layout.tsx            # Shell with bottom nav
│       │   ├── BottomNav.tsx
│       │   ├── CalorieRing.tsx       # Circular progress
│       │   ├── MacroBar.tsx          # Linear progress bar
│       │   ├── FoodEntryCard.tsx     # Single entry in log
│       │   ├── CameraCapture.tsx     # Camera preview + capture
│       │   ├── BarcodeScanner.tsx    # Barcode scanning
│       │   ├── NutritionResult.tsx   # AI/barcode result display
│       │   └── FoodForm.tsx          # Manual entry / edit form
│       ├── pages/
│       │   ├── Dashboard.tsx
│       │   ├── ScanPage.tsx
│       │   ├── HistoryPage.tsx
│       │   ├── WeightPage.tsx
│       │   └── FoodDetailPage.tsx
│       ├── hooks/
│       │   ├── useCamera.ts
│       │   ├── useApi.ts
│       │   └── useGoals.ts
│       ├── lib/
│       │   ├── api.ts               # API client functions
│       │   └── utils.ts
│       └── types/
│           └── index.ts             # Shared TypeScript types
│
├── server/                   # Backend (Express)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts          # Express app entry
│       ├── db.ts             # SQLite setup + migrations
│       ├── routes/
│       │   ├── analyze.ts    # POST /api/analyze (Claude Vision)
│       │   ├── barcode.ts    # GET /api/barcode/:code
│       │   ├── entries.ts    # CRUD /api/entries
│       │   ├── goals.ts      # GET/PUT /api/goals
│       │   └── summary.ts    # GET /api/summary
│       ├── services/
│       │   ├── vision.ts     # Anthropic API integration
│       │   └── openfoodfacts.ts  # OFF API client
│       └── middleware/
│           └── errorHandler.ts
│
├── data/                     # SQLite database (gitignored)
│   └── macrotracker.db
│
└── deploy/                   # Deployment configs
    ├── nginx.conf            # nginx site config
    ├── macrotracker-api.service  # systemd unit for backend
    └── setup.sh              # One-shot deploy script
```

---

## 9. Deployment Strategy

### Port Assignments

| Service | Port | Notes |
|---------|------|-------|
| Express API | 5010 | Internal only, proxied via nginx |
| Vite dev server | 5011 | Development only |
| **Avoid** | 80, 5001, 5002, 5003 | Already in use |

### nginx Configuration

```nginx
server {
    listen 443 ssl;
    server_name macro.76.13.182.206.nip.io;  # or custom domain

    ssl_certificate     /etc/letsencrypt/live/macro.76.13.182.206.nip.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/macro.76.13.182.206.nip.io/privkey.pem;

    # Frontend (built static files)
    root /opt/macrotracker/client/dist;
    index index.html;

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5010;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 10M;  # for photo uploads
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**SSL options (in order of preference):**
1. Let's Encrypt with nip.io subdomain (free, auto-renew)
2. Self-signed cert (works, browser warning on first visit)
3. Caddy as alternative to nginx (auto-HTTPS built in)

### systemd Service

```ini
[Unit]
Description=MacroTracker API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/macrotracker/server
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=5010
EnvironmentFile=/opt/macrotracker/.env

[Install]
WantedBy=multi-user.target
```

### `.env` file
```
ANTHROPIC_API_KEY=<key>
PORT=5010
DATABASE_PATH=/opt/macrotracker/data/macrotracker.db
NODE_ENV=production
```

### Deployment Steps
1. Build client: `cd client && npm run build`
2. Build server: `cd server && npm run build`
3. Copy to `/opt/macrotracker/`
4. Run DB migrations (auto on first start)
5. Enable systemd service
6. Configure nginx, obtain SSL cert
7. Reload nginx

---

## 10. Non-Functional Requirements

- **Response time:** AI analysis < 5s, barcode lookup < 1s, all other endpoints < 200ms
- **Image size:** Max 10MB upload, resize client-side to 1024px max dimension before sending
- **Data retention:** Keep all logs indefinitely (SQLite is lightweight)
- **Backup:** SQLite file can be backed up with simple file copy
- **Browser support:** Chrome/Safari mobile (latest 2 versions)
- **PWA:** Installable with app icon, splash screen, standalone display mode

---

## Appendix: Open Food Facts API

**Endpoint:** `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`

**Relevant fields:**
```
product.product_name
product.nutriments.energy-kcal_100g
product.nutriments.proteins_100g
product.nutriments.carbohydrates_100g
product.nutriments.fat_100g
product.serving_size
product.nutriments.energy-kcal_serving
```

**Rate limit:** Be respectful, add `User-Agent: MacroTracker/1.0` header. No API key required.
