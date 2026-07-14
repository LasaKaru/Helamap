# Customization Guide

## Branding (no code required)

**Admin → Settings**:

- App name, company name, tagline, welcome message
- Logo — upload (embedded base64) or a path like `/logos/company.png`
  (put the file in `public/logos/`)
- Primary brand color (presets + custom picker)
- Contact email / phone / address / website (also fill the legal-page placeholders)
- **SEO title & description** used across all pages
- **White-label** switch — removes the "Powered by FacilityFlow" footer credit

## Legal & company pages

**Admin → Pages** — a rich-text editor for: Privacy Policy, Terms of Service,
Cookie Policy, About Us, Contact Us, Refund Policy, License Information.

- Placeholders `[COMPANY NAME]`, `[CONTACT EMAIL]`, `[PHONE NUMBER]`,
  `[COMPANY ADDRESS]` auto-fill from your branding settings on the public page.
- Static Mode: pages live inside `map-data.json` → export & replace to publish.
- Backend Mode: pages save to the database and go live immediately.
- Public URLs: `/pages/privacy-policy`, `/pages/about`, … (linked in the footer).

## Maps & zones

- Floor plans: put SVG/PNG files in `public/maps/`, reference as `/maps/file.svg`,
  set the pixel width/height (the SVG `viewBox` size).
- Zones: draw polygons visually (click to add points, drag to adjust), pick
  color & icon, add tags, status badges, safety notes, photos, translations.
- Zone templates give one-click starting points (warehouse, office, line…).
- Stairs/elevators: create a small zone, set **connects to floor** — visitors
  get a one-tap floor jump.
- Emergency exits: tick **Emergency exit** — highlighted by the public
  emergency button.

## Theme & styling

- Colors live in `tailwind.config.js` (`ink` scale) and per-zone in the data.
- Global look: `src/index.css` (`glass`, `card`, `btn-*` component classes).
- Dark/light mode follows the visitor's system and is toggleable in the UI.

## Languages

English + Sinhala ship built in (`src/lib/i18n.tsx` → `DICT`). To add a
language: extend the `Lang` type and `DICT`, then provide per-zone
`translations.<lang>` in the map data. The structure is already
multi-language-ready.

## Static admin password

Set before building (in `.env`):

```
VITE_ADMIN_PASSWORD_HASH=$2b$10$...   # bcrypt hash (recommended)
# or
VITE_ADMIN_PASSWORD=your-password     # plain (convenient, less discreet)
```

Generate a hash: `node -e "console.log(require('bcryptjs').hashSync('yourpass',10))"`
