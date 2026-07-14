# Dual-Mode Architecture

FacilityFlow is **static-first**: everything works from one JSON file with zero
servers. Backend Mode is a superset you can switch on at any time.

## How the switch works

The toggle in **Admin → Settings → Backend Mode** stores
`{ enabled, url }` in the browser's localStorage. Every data consumer goes
through one seam:

| Concern | Static Mode | Backend Mode |
|---|---|---|
| Public map data | `GET data/map-data.json` | `GET {url}/api/map` (fallback → static file) |
| Publishing changes | Export JSON → replace file on host | **Publish now** button → `PUT /api/map` (instant) |
| Admin login | Single password (bcrypt-checked in browser) | Email + password → JWT + refresh tokens |
| Users & roles | — | Full CRUD, 4 roles, SQLite |
| Legal pages | Stored inside `map-data.json` | Stored in DB (`pages` table) |
| Zone analytics | localStorage counts (per device) | Server-side counts + activity log |
| Version history | Last 5 exports in browser | Last 20 saves on server |
| Contact form | Opens the visitor's mail client | `POST /api/contact` stored in DB |

## Availability detection & graceful fallback

- `GET /api/health` (3.5 s timeout) is used to test connections from Settings
  and by the login screen.
- The public map tries the API first; on any failure it silently loads the
  static JSON and sets a `backendOffline` flag, which renders the
  "Backend unreachable — showing the last published static map" badge.
- The admin login offers a static-password fallback when the API is down, so
  you can always reach Settings to fix the URL.

## Recommended setups

- **Small company / demo / offline kiosk** → Static Mode on any static host.
- **One facility manager + a few editors** → Backend Mode via Docker on a
  small VPS (Railway/Render/Fly free tiers work too).
- **Belt and braces** → Backend Mode, plus periodically export
  `map-data.json` into the static deploy as a disaster fallback (the same file
  doubles as your backup).
