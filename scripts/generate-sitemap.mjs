/**
 * Generates dist/sitemap.xml after `vite build`.
 * Set SITE_URL to your production origin, e.g.:
 *   SITE_URL=https://map.yourcompany.com npm run build
 */
import fs from 'node:fs';
import path from 'node:path';

const SITE_URL = (process.env.SITE_URL ?? 'https://example.com').replace(/\/$/, '');
const dist = path.resolve(process.cwd(), 'dist');

const staticRoutes = ['/', '/map', '/qr'];
const pageSlugs = [
  'about',
  'contact',
  'privacy-policy',
  'terms-of-service',
  'cookie-policy',
  'refund-policy',
  'license',
];

const urls = [...staticRoutes, ...pageSlugs.map((s) => `/pages/${s}`)];
const now = new Date().toISOString().slice(0, 10);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url><loc>${SITE_URL}${u}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq></url>`,
  )
  .join('\n')}
</urlset>
`;

fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, 'sitemap.xml'), xml);

// GitHub Pages SPA fallback: serving index.html as 404 keeps clean URLs working.
const index = path.join(dist, 'index.html');
if (fs.existsSync(index)) fs.copyFileSync(index, path.join(dist, '404.html'));

console.log(`✔ sitemap.xml (${urls.length} URLs, base ${SITE_URL}) + 404.html generated`);
