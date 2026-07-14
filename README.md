# HelaMap 🗺️

**A mobile-first, interactive 2D facility wayfinding & onboarding map — 100% static, zero backend.**

New hires scan a QR code at the entrance and instantly get a beautiful, pinch-zoomable
floor plan of the whole facility in their mobile browser: tap any zone (Inventory,
Bamburio Assembly, Quality Control, Canteen…) for descriptions, contacts, photos and
safety notes, with an animated "You are here" route to wherever they need to go.

Built with **React 18 + TypeScript + Vite**, **Tailwind CSS**, **Framer Motion**,
**react-zoom-pan-pinch** and **lucide-react**. No database, no API, no server code —
all content lives in a single static file: [`public/data/map-data.json`](public/data/map-data.json).

---

## ✨ Features

### Public map (`#/map`)
- Buttery pinch-zoom / pan / double-tap zoom, tuned for phones
- Tappable colored zone polygons over a pure-SVG floor plan (no map-tile libraries)
- Bottom sheet with description, expandable details, safety warnings, photos,
  **Get directions** (animated route from the scanned location) and **Share location** deep links
- Building & floor switchers with smooth cross-fade; **stairs/elevator zones**
  offer a one-tap jump to the connected floor (`connectsToFloorId`)
- Live zone search with **#tag filters**, plus **favorites (star)** and
  **recently viewed** — persisted on the device, surfaced in search and on the landing page
- **Emergency mode**: a red siren button highlights every `isExit` zone and dims the rest
- **English / සිංහල toggle** — UI strings are built in; per-zone translations
  live in the JSON (`zone.translations.si`)
- **Status badges** (`busy`, `low-stock`, `maintenance`, `closed`) as pulsing
  dots on map labels and colored chips in the sheet
- **Personal notes** per zone, stored only in the visitor's browser
- Dark/light mode, "last updated" badge
- Deep links: `#/map?building=b1&floor=f1&zone=z-inventory&here=z-entrance`
  (`highlight=` works as an alias for `zone=`)

### PWA / offline
- Installable to the home screen (`manifest.webmanifest`)
- Service worker caches the app shell, floor plans and photos **cache-first**,
  and `map-data.json` **network-first with offline fallback** — after the first
  visit the map works with no signal. Bump `CACHE_VERSION` in `public/sw.js`
  to force-refresh clients.

### Admin panel (`#/admin`, password-protected)
- Dashboard with building/floor/zone counts and last export date
- **Settings**: company name, app name, logo (upload or path), brand color, tagline,
  welcome message, contact email/phone/address/website — all stored in the JSON
- Full CRUD for buildings, floors (incl. map image upload with auto width/height) and zones
- **Zone templates** (warehouse, office, production line, first aid, meeting
  room, stairs) to start new zones with sensible defaults
- Zone fields for **tags**, **status badge**, **emergency exit** flag and the
  **stairs/elevator floor connector**
- **Visual polygon editor**: click the floor plan to add points, drag to adjust,
  auto-calculated center, live color preview, other zones shown as context
- Live preview tab rendering the real public map from your draft
- **Export map-data.json** (with confetti 🎉), **Import** a previous file,
  **Reset to sample data**, **Discard draft**
- **Version history**: the last 5 exports are kept in the browser and can be
  re-downloaded (`map-data-v2.json`, …) or restored into the draft
- **Most-viewed zones** insight on the dashboard (view counts recorded locally
  on each device — no tracking, no server)
- Drafts auto-save to `localStorage` — nothing is public until you export

### QR generator (`#/qr`)
- Pure-frontend QR codes (no external service) for any building/floor,
  optionally pinned to a "You are here" zone
- Printable poster layout, PNG download, copy-link
- **QR gallery**: one "You are here" code for every zone, downloadable
  individually or printed as a single sheet

---

## 🚀 Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

Production build:

```bash
npm run build      # outputs static site to dist/
npm run preview    # serve the build locally
```

**Admin password:** `facility2026` by default. Override at build time with a `.env` file:

```
VITE_ADMIN_PASSWORD=your-password
```

> ⚠️ This is client-side protection only — it deters casual visitors, it is not real
> security. Don't put secrets in the map data.

---

## 🌍 Deploy (any static host)

The app uses **hash routing** (`/#/map?...`), so deep links and QR codes work on every
static host with **zero rewrite/redirect configuration**.

| Host | How |
|---|---|
| **Netlify** | Drag & drop the `dist/` folder onto app.netlify.com, or connect the repo (build: `npm run build`, publish dir: `dist`) |
| **Vercel** | Import the repo — Vite is auto-detected (output `dist`) |
| **GitHub Pages** | Set `base: '/<repo-name>/'` in `vite.config.ts`, build, publish `dist/` (e.g. with `gh-pages` or an Action) |
| **Cloudflare Pages** | Connect repo, build `npm run build`, output `dist` |
| **IIS / Apache / Nginx** | Copy the contents of `dist/` into any web folder. Done. |

---

## 🔄 The admin workflow (edit → export → replace)

1. Open `https://your-site/#/admin` and unlock with the password.
2. Edit anything — company branding, buildings, floors, zones, polygons.
   Every change is auto-saved as a **local browser draft** (visitors see nothing yet).
3. Click **Export map-data.json**. A fresh file downloads.
4. Replace `data/map-data.json` in the deployed site folder:
   - Netlify/Vercel/Pages via git: overwrite `public/data/map-data.json`, commit, push.
   - Netlify drag-drop / plain server (IIS, Apache): overwrite `data/map-data.json`
     inside the published folder directly.
5. The next QR scan loads the new data instantly (the app fetches it with cache-busting).

Use **Import map-data.json** to reload a previously exported file, and
**Reset to sample data** to restore the demo facility.

---

## 🗺️ Adding a new floor plan

1. Create the plan as an SVG or PNG (SVG recommended — crisp at any zoom).
   Simple rectangles + a grid look great; see `public/maps/*.svg` for the style.
2. Drop the file into `public/maps/` (deployed: the `maps/` folder next to `index.html`).
3. In **Admin → Buildings & Zones**, add/edit a floor:
   - set **Map image path** to `/maps/your-file.svg`
   - set **Map width/height** to the image's pixel size (its SVG `viewBox` size)
   - (or use **Upload image** — it embeds as base64 and auto-fills the size;
     best kept under ~1.5 MB)
4. Add zones and draw their polygons directly on the plan. Coordinates are in
   map pixels relative to that width/height.

Zone photos work the same way: put files in `public/photos/` and reference
`/photos/name.jpg` in the zone's photo field.

---

## 🔳 Generating & printing QR codes

1. Open `https://your-site/#/qr`.
2. Pick the building + floor, and optionally the zone where the poster will hang —
   that becomes the **"You are here"** marker when scanned.
3. **Download PNG** or **Print** the ready-made poster.
4. Repeat per location: the entrance gets a plain floor link, the canteen door gets
   `here=z-canteen`, etc.

Any deep link can also be shared manually:

```
https://your-site/#/map?building=b1&floor=f1&zone=z-qc          → opens QC zone
https://your-site/#/map?building=b1&floor=f1&here=z-entrance    → you-are-here at entrance
```

---

## 📁 Project structure

```
public/
  data/map-data.json        ← ALL content lives here (the only file admins touch)
  maps/*.svg                ← floor plan images
  photos/*.svg              ← zone photos
src/
  pages/                    LandingPage · MapPage · QRPage · AdminPage
  components/
    map/                    MapViewer · MapExperience · MapTopBar · ZoneBottomSheet · SplashScreen
    admin/                  AdminDashboard · SettingsEditor · ContentEditor · ZoneEditor · PolygonEditor · ExportPanel · AdminLogin
    ui/                     Logo · ThemeToggle
  hooks/                    useMapData · useAdminDraft · useTheme
  lib/                      data.ts · icons.tsx · utils.ts · confetti.ts
  config.ts                 password / storage keys / data URL
  types.ts                  MapData · Building · Floor · Zone · AppSettings
```

### `map-data.json` shape (excerpt)

```jsonc
{
  "appName": "HelaMap",
  "companyName": "Your Company",
  "logo": "/logos/company.png",        // or base64 data URL from admin upload
  "primaryColor": "#3B82F6",
  "lastUpdated": "2026-07-13T12:00:00Z",
  "buildings": [{
    "id": "b1", "name": "Main Production Hall", "description": "…",
    "floors": [{
      "id": "f1", "name": "Ground Floor", "level": 0,
      "mapImage": "/maps/main-ground.svg", "mapWidth": 2000, "mapHeight": 1400,
      "zones": [{
        "id": "z-inventory", "name": "Main Inventory Section", "shortName": "Inventory",
        "color": "#3B82F6", "icon": "package",
        "description": "…", "details": "• line one\n• line two",
        "safetyNotes": "…",
        "polygon": [[100,300],[700,300],[700,900],[100,900]],   // map pixels
        "center": [400,600],
        "photo": "/photos/inventory.svg"
      }]
    }]
  }]
}
```

---

## 🌐 Roadmap-ready

- Text content is centralized in the JSON, so multi-language support can be added by
  swapping data files or extending the schema.
- Branding (name, logo, colors, contact) is fully data-driven — the same codebase can
  be re-skinned into a recruitment/onboarding site without code changes.
