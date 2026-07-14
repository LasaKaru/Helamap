# Changelog

All notable changes to FacilityFlow.

## [2.0.0] — 2026-07-14

### Added — FacilityFlow (CodeCanyon release)
- **Dual-Mode architecture**: Static Mode (JSON file, zero backend) + toggleable
  Backend Mode (Node/Express/SQLite REST API) with automatic availability
  detection and graceful static fallback
- **Full user management** (Backend Mode): 4 roles, JWT + rotating refresh
  tokens, bcrypt, rate limiting, soft delete, last-login tracking, activity log
- **Editable legal & company pages** with TipTap rich-text editor (Privacy,
  Terms, Cookies, About, Contact + form, Refunds, License)
- **SEO**: react-helmet-async meta/OG/Twitter, JSON-LD, sitemap.xml generator,
  robots.txt, clean URLs (BrowserRouter + SPA fallbacks for every host)
- **Instant publishing** in Backend Mode + server-side version history (20)
- Server-side zone analytics + contact inbox + backup/restore endpoints
- Docker Compose, per-service Dockerfiles, PM2 ecosystem, `start:full` script
- White-label switch, SEO settings, bcrypt-hashed static admin password
- Complete documentation set (installation, dual mode, roles, customization,
  deployment, FAQ) + Envato license file

## [1.1.0] — 2026-07-13

### Added
- Emergency mode highlighting exit zones; stairs/elevator floor connectors
- English/Sinhala language toggle with per-zone translations in JSON
- Zone tag filters, favorites, recently viewed, personal notes
- Status badges (busy / low stock / maintenance / closed)
- PWA: installable, offline-first service worker
- Admin: zone templates, export version history, local most-viewed insight
- QR gallery with print-all sheet

## [1.0.0] — 2026-07-13

### Added
- Initial release: interactive SVG facility map (pinch-zoom, polygons, bottom
  sheets, directions, deep links), admin CMS with visual polygon editor,
  branding settings, JSON export/import workflow, QR generator, sample
  manufacturing-plant dataset
