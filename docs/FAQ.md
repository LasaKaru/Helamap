# FAQ

**Do I need a server?**
No. Static Mode is the default and runs on any static host. Backend Mode is an
optional upgrade for multi-user teams.

**How do visitors get the map?**
Print QR codes from `/qr` (per building/floor/zone) and post them around the
facility. Scanning opens the map in the browser — no app install.

**How do I publish map changes?**
Static Mode: Admin → Export → replace `data/map-data.json` on your host.
Backend Mode: Admin → Publish now (instant).

**I enabled Backend Mode and the map still shows old data.**
The public map falls back to the static file whenever the API is unreachable —
check the API URL in Settings → Test connection, the server logs, and that
`CORS_ORIGINS` includes your frontend origin.

**I forgot the admin password.**
Static Mode: rebuild with a new `VITE_ADMIN_PASSWORD(_HASH)`.
Backend Mode: another Super Admin can reset it in Users; or delete
`server/data/facilityflow.db` to re-seed (⚠ wipes all backend data).

**Does it work offline?**
Yes — it's a PWA. After the first visit the app shell, floor plans and the
last map data are cached; visitors can install it to their home screen.

**Can I use my own floor plan images?**
Yes — SVG or PNG in `public/maps/`. Enter the image path and pixel size on the
floor, then draw zones on top. SVG stays crisp at any zoom.

**How big can maps be?**
Keep floor images under ~1.5 MB each and reference them by path (don't embed
base64) — the JSON stays small and loads instantly.

**Is the static admin password secure?**
It's a soft lock (the check runs in the browser). Anything truly sensitive
should use Backend Mode, where auth happens server-side with bcrypt + JWT.

**Can I remove "Powered by FacilityFlow"?**
Yes — Settings → White-label (allowed under both Envato licenses).

**Which license do I need?**
Regular License: one end product, end users are not charged. Extended License:
end users are charged (e.g. you sell access). See LICENSE.txt.
