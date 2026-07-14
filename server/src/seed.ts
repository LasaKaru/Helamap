/**
 * Seeds the SQLite database with:
 *  - the sample facility map (from ../public/data/map-data.json)
 *  - default legal pages
 *  - a super admin (from .env) + demo users
 *
 * Safe to run repeatedly: existing rows are kept, missing ones are created.
 * Run with: npm run seed
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { config } from './config.js';
import { DEFAULT_PAGES } from './defaultPages.js';

const here = path.dirname(fileURLToPath(import.meta.url));

export function seed(): void {
  // 1. Super admin + demo users
  const userCount = (db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }).n;
  if (userCount === 0) {
    const insert = db.prepare(
      'INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)',
    );
    insert.run(
      config.seedAdminEmail.toLowerCase(),
      config.seedAdminName,
      bcrypt.hashSync(config.seedAdminPassword, 10),
      'super_admin',
    );
    insert.run('manager@facilityflow.local', 'Demo Manager', bcrypt.hashSync('Manager123!', 10), 'facility_manager');
    insert.run('editor@facilityflow.local', 'Demo Editor', bcrypt.hashSync('Editor123!', 10), 'editor');
    insert.run('viewer@facilityflow.local', 'Demo Viewer', bcrypt.hashSync('Viewer123!', 10), 'viewer');
    console.log(`✔ Users seeded — super admin: ${config.seedAdminEmail} / ${config.seedAdminPassword}`);
    console.log('  Demo accounts: manager@facilityflow.local (Manager123!), editor@… (Editor123!), viewer@… (Viewer123!)');
  }

  // 2. Sample map data
  const hasMap = db.prepare('SELECT COUNT(*) AS n FROM map_data').get() as { n: number };
  if (hasMap.n === 0) {
    const candidates = [
      path.resolve(here, '../seed-data/map-data.json'), // Docker image / packaged
      path.resolve(here, '../../seed-data/map-data.json'),
      path.resolve(here, '../../public/data/map-data.json'), // monorepo dev
      path.resolve(here, '../../../public/data/map-data.json'),
      path.resolve(process.cwd(), '../public/data/map-data.json'),
    ];
    const file = candidates.find((p) => fs.existsSync(p));
    if (file) {
      db.prepare("INSERT INTO map_data (id, json, updated_by) VALUES (1, ?, 'seed')").run(
        fs.readFileSync(file, 'utf8'),
      );
      console.log(`✔ Map data seeded from ${file}`);
    } else {
      console.warn('⚠ Sample map-data.json not found — save from the admin panel to create map data.');
    }
  }

  // 3. Default legal pages
  const insertPage = db.prepare(
    'INSERT INTO pages (slug, title, html) VALUES (?, ?, ?) ON CONFLICT(slug) DO NOTHING',
  );
  for (const p of DEFAULT_PAGES) insertPage.run(p.slug, p.title, p.html);
}

// Allow `npm run seed` to work standalone.
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seed();
  console.log('Seed complete.');
}
