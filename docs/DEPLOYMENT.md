# Deployment Guide

## Static Mode

Build once, host anywhere:

```bash
SITE_URL=https://map.yourcompany.com npm run build
```

- **Netlify** — drag & drop `dist/`, or connect the repo (build `npm run build`,
  publish `dist`). `_redirects` handles clean URLs.
- **Vercel** — import the repo; `vercel.json` handles rewrites.
- **Cloudflare Pages** — build `npm run build`, output `dist`.
- **GitHub Pages** — set `base: '/<repo>/'` in `vite.config.ts`; the generated
  `404.html` keeps clean URLs working.
- **Apache / IIS** — copy `dist/` into the web root; `.htaccess` / `web.config`
  are included in the build output.
- **nginx** — use `deploy/nginx.conf`.

Publishing updates: Admin → Export → overwrite `data/map-data.json` on the host.

## Backend Mode

### Docker (any VPS)

```bash
docker compose up --build -d
```

Put a reverse proxy (Caddy/nginx/Traefik) with HTTPS in front of ports
8080 (web) and 4000 (API), or proxy `/api/` from the web vhost to the backend
(see the commented block in `deploy/nginx.conf`).

### Railway / Render / Fly.io

1. Deploy the `server/` folder as a Node service:
   - Build: `npm install && npm run build`
   - Start: `npm start`
   - Persistent disk mounted where `DATABASE_PATH` points (e.g. `/data`).
2. Set env vars from `server/.env.example` (secrets, `CORS_ORIGINS` = your
   frontend origin).
3. Deploy the frontend as a static site (as above).
4. Admin → Settings → Backend Mode → enter the service URL → enable.

### Bare VPS with PM2

```bash
npm run build && npm run build:backend
pm2 start ecosystem.config.cjs && pm2 save
```

Serve `dist/` from nginx; keep SQLite (`server/data/`) on persistent storage
and back it up (it's a single file).

## Production checklist

- [ ] Changed `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`
- [ ] Changed / removed all demo accounts
- [ ] `CORS_ORIGINS` set to the real frontend origin only
- [ ] HTTPS in front of both web and API
- [ ] `SITE_URL` set at build time (correct sitemap)
- [ ] Static admin password changed (`VITE_ADMIN_PASSWORD_HASH`)
- [ ] Backup plan for `facilityflow.db` (single file) or JSON exports
