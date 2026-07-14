# FacilityFlow 🗺️ — Interactive Facility Map & Wayfinding CMS

**Mobile-first interactive 2D wayfinding for factories, warehouses, hospitals,
campuses and offices.** Visitors scan a QR code and instantly get a beautiful,
pinch-zoomable facility map. Managers get a full CMS — with or without a backend.

> **Dual Mode:** run 100% static from one JSON file on any host, or flip a
> switch in Settings for a Node + SQLite backend with multi-user accounts,
> instant publishing and server analytics. If the API ever goes down, the map
> gracefully falls back to the static file.

Default admin password (Static Mode): **facility2026** · Default backend login:
**admin@facilityflow.local / ChangeMe123!** (change both before production).

---

## Quick start

```bash
# Static Mode (no server)
npm install
npm run dev                 # http://localhost:5173

# Full stack (frontend + API)
npm --prefix server install
npm run start:full          # web :5173 · api :4000

# One-command production stack
docker compose up --build   # web :8080 · api :4000
```

## Feature highlights

**Public experience** — SVG floor plans with buttery pinch-zoom; tappable zone
polygons with glow; bottom sheets with details, photos, safety notes and
animated directions; building/floor switching with stairs/elevator jumps;
search with #tag filters; favorites & recents; emergency-exit mode;
English/සිංහල toggle; status badges; personal notes; dark/light; installable
PWA that works offline; deep links (`/map?building=b1&floor=f1&zone=z-inventory&here=z-entrance`,
`highlight=` alias supported).

**Admin CMS** (`/admin`) — dashboard with stats & most-viewed zones; branding
(logo, colors, SEO, white-label); full CRUD for buildings/floors/zones with a
visual polygon editor and zone templates; TipTap rich-text editor for legal
pages (Privacy, Terms, Cookies, About, Contact + form, Refunds, License);
QR generator with per-zone gallery and print sheets; export/import, version
history, reset to sample.

**Backend Mode extras** — email/password sign-in (JWT + rotating refresh
tokens, bcrypt); Super Admin / Facility Manager / Editor / Viewer roles;
user management with activation & soft delete; **Publish now** (no file
replacement); server version history; zone-view analytics; contact inbox;
activity log; one-call backup & restore.

**SEO** — dynamic meta/OG/Twitter tags, JSON-LD, generated `sitemap.xml`,
`robots.txt`, clean URLs with SPA fallbacks for Netlify, Vercel, Apache, IIS,
nginx and GitHub Pages.

## Documentation

| Guide | Contents |
|---|---|
| [docs/INSTALLATION.md](docs/INSTALLATION.md) | Static, npm, Docker setups + first login |
| [docs/DUAL-MODE.md](docs/DUAL-MODE.md) | How the mode switch & fallback work |
| [docs/USER-ROLES.md](docs/USER-ROLES.md) | Role matrix + security details |
| [docs/CUSTOMIZATION.md](docs/CUSTOMIZATION.md) | Branding, pages, maps, languages, passwords |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Netlify/Vercel/Pages/VPS/Railway/Render + checklist |
| [docs/FAQ.md](docs/FAQ.md) | Common questions |
| [docs/CODECANYON-LISTING.md](docs/CODECANYON-LISTING.md) | Sales-page kit, screenshots, video script |
| [CHANGELOG.md](CHANGELOG.md) | Version history |
| [LICENSE.txt](LICENSE.txt) | Envato Regular/Extended license terms |

## Project structure

```
public/          static assets · data/map-data.json · maps/ · SPA fallbacks · PWA
src/             React app (pages/, components/{map,admin,ui}, hooks/, lib/)
server/          Express + SQLite API (src/, seed-data/, Dockerfile, .env.example)
docs/            buyer documentation
deploy/          nginx.conf reference
scripts/         sitemap generator
docker-compose.yml · Dockerfile · ecosystem.config.cjs (PM2) · vercel.json
```

## The static publishing workflow (no backend)

1. Edit anything in `/admin` — auto-saved as a browser draft.
2. **Export map-data.json** (confetti included 🎉).
3. Overwrite `data/map-data.json` on your host. The next scan shows the update.

In Backend Mode this becomes a single **Publish now** click.

## License

Commercial product — Envato Market License (Regular or Extended). See
[LICENSE.txt](LICENSE.txt). Bundled open-source dependencies remain under
their own permissive licenses.
