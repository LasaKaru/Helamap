import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import {
  consumeRefreshToken,
  issueRefreshToken,
  requireRole,
  revokeRefreshToken,
  signAccessToken,
  ROLE_RANK,
  type AuthedRequest,
  type Role,
} from './auth.js';
import { db, logActivity, toPublicUser, type UserRow } from './db.js';

export const api = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts — try again in 15 minutes.' },
});

/* ─────────────────────────── health ─────────────────────────── */

api.get('/health', (_req, res) => {
  res.json({ ok: true, product: 'FacilityFlow', mode: 'backend', version: '2.0.0' });
});

/* ─────────────────────────── auth ─────────────────────────── */

api.post('/auth/login', loginLimiter, (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string')
    return res.status(400).json({ error: 'email and password are required' });

  const user = db
    .prepare('SELECT * FROM users WHERE email = ? AND deleted = 0')
    .get(email.toLowerCase().trim()) as UserRow | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'Invalid email or password' });
  if (!user.active) return res.status(403).json({ error: 'Account is deactivated' });

  db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);
  logActivity(user.email, 'login');

  res.json({
    accessToken: signAccessToken(user),
    refreshToken: issueRefreshToken(user.id),
    user: toPublicUser(user),
  });
});

api.post('/auth/refresh', (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (typeof refreshToken !== 'string')
    return res.status(400).json({ error: 'refreshToken is required' });
  const user = consumeRefreshToken(refreshToken);
  if (!user) return res.status(401).json({ error: 'Invalid or expired refresh token' });
  res.json({
    accessToken: signAccessToken(user),
    refreshToken: issueRefreshToken(user.id),
    user: toPublicUser(user),
  });
});

api.post('/auth/logout', (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (typeof refreshToken === 'string') revokeRefreshToken(refreshToken);
  res.json({ ok: true });
});

api.get('/auth/me', requireRole('viewer'), (req: AuthedRequest, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ? AND deleted = 0').get(req.user!.id) as
    | UserRow
    | undefined;
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: toPublicUser(user) });
});

/* ─────────────────────────── users (facility_manager+) ─────────────────────────── */

/** A manager may not touch accounts that outrank them. */
function canManage(actorRole: Role, targetRole: Role): boolean {
  return ROLE_RANK[actorRole] >= ROLE_RANK[targetRole];
}

api.get('/users', requireRole('facility_manager'), (_req, res) => {
  const rows = db
    .prepare('SELECT * FROM users WHERE deleted = 0 ORDER BY created_at ASC')
    .all() as UserRow[];
  res.json({ users: rows.map(toPublicUser) });
});

api.post('/users', requireRole('facility_manager'), (req: AuthedRequest, res) => {
  const { email, name, password, role } = req.body ?? {};
  if (!email || !name || !password || !role)
    return res.status(400).json({ error: 'email, name, password and role are required' });
  if (!(role in ROLE_RANK)) return res.status(400).json({ error: 'Invalid role' });
  if (String(password).length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (!canManage(req.user!.role, role))
    return res.status(403).json({ error: 'You cannot create a user with a higher role than yours' });

  try {
    const info = db
      .prepare('INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(String(email).toLowerCase().trim(), String(name).trim(), bcrypt.hashSync(password, 10), role);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid) as UserRow;
    logActivity(req.user!.email, 'user.create', user.email);
    res.status(201).json({ user: toPublicUser(user) });
  } catch (e) {
    if (String(e).includes('UNIQUE')) return res.status(409).json({ error: 'Email already in use' });
    throw e;
  }
});

api.put('/users/:id', requireRole('facility_manager'), (req: AuthedRequest, res) => {
  const target = db
    .prepare('SELECT * FROM users WHERE id = ? AND deleted = 0')
    .get(req.params.id) as UserRow | undefined;
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (!canManage(req.user!.role, target.role))
    return res.status(403).json({ error: 'You cannot modify a user with a higher role than yours' });

  const { name, role, active, password } = req.body ?? {};
  if (role !== undefined) {
    if (!(role in ROLE_RANK)) return res.status(400).json({ error: 'Invalid role' });
    if (!canManage(req.user!.role, role))
      return res.status(403).json({ error: 'You cannot assign a higher role than yours' });
  }
  if (target.id === req.user!.id && (active === false || (role && role !== target.role)))
    return res.status(400).json({ error: 'You cannot deactivate or demote your own account' });
  if (password !== undefined && String(password).length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });

  db.prepare(
    `UPDATE users SET
       name = COALESCE(?, name),
       role = COALESCE(?, role),
       active = COALESCE(?, active),
       password_hash = COALESCE(?, password_hash)
     WHERE id = ?`,
  ).run(
    name !== undefined ? String(name).trim() : null,
    role ?? null,
    active === undefined ? null : active ? 1 : 0,
    password ? bcrypt.hashSync(String(password), 10) : null,
    target.id,
  );
  if (password || active === false)
    db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(target.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(target.id) as UserRow;
  logActivity(req.user!.email, 'user.update', user.email);
  res.json({ user: toPublicUser(user) });
});

api.delete('/users/:id', requireRole('facility_manager'), (req: AuthedRequest, res) => {
  const target = db
    .prepare('SELECT * FROM users WHERE id = ? AND deleted = 0')
    .get(req.params.id) as UserRow | undefined;
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.id === req.user!.id)
    return res.status(400).json({ error: 'You cannot delete your own account' });
  if (!canManage(req.user!.role, target.role))
    return res.status(403).json({ error: 'You cannot delete a user with a higher role than yours' });

  // Soft delete keeps referential history; free the email for reuse.
  db.prepare(
    "UPDATE users SET deleted = 1, active = 0, email = email || '.deleted.' || id WHERE id = ?",
  ).run(target.id);
  db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(target.id);
  logActivity(req.user!.email, 'user.delete', target.email);
  res.json({ ok: true });
});

/* ─────────────────────────── map data ─────────────────────────── */

api.get('/map', (_req, res) => {
  const row = db.prepare('SELECT json, updated_at FROM map_data WHERE id = 1').get() as
    | { json: string; updated_at: string }
    | undefined;
  if (!row) return res.status(404).json({ error: 'No map data yet — run the seed or save from admin' });
  res.type('application/json').send(row.json);
});

api.put('/map', requireRole('editor'), (req: AuthedRequest, res) => {
  const data = req.body;
  if (!data || typeof data !== 'object' || !Array.isArray(data.buildings))
    return res.status(400).json({ error: 'Invalid map data: missing buildings array' });
  const json = JSON.stringify({ ...data, lastUpdated: new Date().toISOString() });
  if (json.length > 8_000_000)
    return res.status(413).json({ error: 'Map data too large (8 MB limit) — use image paths, not base64' });

  db.prepare(
    `INSERT INTO map_data (id, json, updated_at, updated_by) VALUES (1, ?, datetime('now'), ?)
     ON CONFLICT(id) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
  ).run(json, req.user!.email);
  db.prepare('INSERT INTO map_versions (json, created_by) VALUES (?, ?)').run(json, req.user!.email);
  db.prepare(
    'DELETE FROM map_versions WHERE id NOT IN (SELECT id FROM map_versions ORDER BY id DESC LIMIT 20)',
  ).run();
  logActivity(req.user!.email, 'map.save');
  res.json({ ok: true });
});

api.get('/map/versions', requireRole('editor'), (_req, res) => {
  const rows = db
    .prepare('SELECT id, created_at, created_by, length(json) AS size FROM map_versions ORDER BY id DESC')
    .all();
  res.json({ versions: rows });
});

api.get('/map/versions/:id', requireRole('editor'), (req, res) => {
  const row = db.prepare('SELECT json FROM map_versions WHERE id = ?').get(req.params.id) as
    | { json: string }
    | undefined;
  if (!row) return res.status(404).json({ error: 'Version not found' });
  res.type('application/json').send(row.json);
});

/* ─────────────────────────── pages ─────────────────────────── */

api.get('/pages', (_req, res) => {
  const rows = db.prepare('SELECT slug, title, updated_at FROM pages ORDER BY slug').all();
  res.json({ pages: rows });
});

api.get('/pages/:slug', (req, res) => {
  const row = db.prepare('SELECT slug, title, html, updated_at FROM pages WHERE slug = ?').get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'Page not found' });
  res.json({ page: row });
});

api.put('/pages/:slug', requireRole('facility_manager'), (req: AuthedRequest, res) => {
  const { title, html } = req.body ?? {};
  if (typeof title !== 'string' || typeof html !== 'string')
    return res.status(400).json({ error: 'title and html are required' });
  db.prepare(
    `INSERT INTO pages (slug, title, html, updated_at) VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(slug) DO UPDATE SET title = excluded.title, html = excluded.html, updated_at = excluded.updated_at`,
  ).run(req.params.slug, title, html);
  logActivity(req.user!.email, 'page.save', req.params.slug);
  res.json({ ok: true });
});

/* ─────────────────────────── analytics ─────────────────────────── */

const viewLimiter = rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: false, legacyHeaders: false });

api.post('/analytics/view', viewLimiter, (req, res) => {
  const { zoneId } = req.body ?? {};
  if (typeof zoneId !== 'string' || zoneId.length > 100)
    return res.status(400).json({ error: 'zoneId is required' });
  db.prepare(
    `INSERT INTO zone_views (zone_id, day, count) VALUES (?, date('now'), 1)
     ON CONFLICT(zone_id, day) DO UPDATE SET count = count + 1`,
  ).run(zoneId);
  res.json({ ok: true });
});

api.get('/analytics', requireRole('editor'), (_req, res) => {
  const totals = db
    .prepare('SELECT zone_id AS zoneId, SUM(count) AS views FROM zone_views GROUP BY zone_id ORDER BY views DESC')
    .all();
  const last14 = db
    .prepare(
      `SELECT day, SUM(count) AS views FROM zone_views
       WHERE day >= date('now', '-13 days') GROUP BY day ORDER BY day`,
    )
    .all();
  res.json({ totals, last14 });
});

api.get('/activity', requireRole('facility_manager'), (_req, res) => {
  const rows = db
    .prepare('SELECT user_email, action, detail, created_at FROM activity_log ORDER BY id DESC LIMIT 100')
    .all();
  res.json({ activity: rows });
});

/* ─────────────────────────── contact ─────────────────────────── */

const contactLimiter = rateLimit({ windowMs: 60_000, limit: 5, standardHeaders: false, legacyHeaders: false });

api.post('/contact', contactLimiter, (req, res) => {
  const { name, email, message } = req.body ?? {};
  if (!name || !email || !message)
    return res.status(400).json({ error: 'name, email and message are required' });
  db.prepare('INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)').run(
    String(name).slice(0, 200),
    String(email).slice(0, 200),
    String(message).slice(0, 5000),
  );
  // Hook point: send an email notification here with nodemailer if SMTP is configured.
  res.json({ ok: true });
});

api.get('/contact', requireRole('facility_manager'), (_req, res) => {
  const rows = db
    .prepare('SELECT id, name, email, message, created_at FROM contact_messages ORDER BY id DESC LIMIT 200')
    .all();
  res.json({ messages: rows });
});

/* ─────────────────────────── backup / restore (super admin) ─────────────────────────── */

api.get('/backup', requireRole('super_admin'), (_req, res) => {
  const map = db.prepare('SELECT json FROM map_data WHERE id = 1').get() as { json: string } | undefined;
  const pages = db.prepare('SELECT slug, title, html, updated_at FROM pages').all();
  const users = db.prepare('SELECT * FROM users WHERE deleted = 0').all() as UserRow[];
  res.setHeader('Content-Disposition', 'attachment; filename="facilityflow-backup.json"');
  res.json({
    product: 'FacilityFlow',
    exportedAt: new Date().toISOString(),
    map: map ? JSON.parse(map.json) : null,
    pages,
    users, // includes bcrypt hashes so restore keeps credentials — store backups securely!
  });
});

api.post('/restore', requireRole('super_admin'), (req: AuthedRequest, res) => {
  const { map, pages, users } = req.body ?? {};
  const restore = db.transaction(() => {
    if (map && typeof map === 'object' && Array.isArray(map.buildings)) {
      db.prepare(
        `INSERT INTO map_data (id, json, updated_at, updated_by) VALUES (1, ?, datetime('now'), ?)
         ON CONFLICT(id) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
      ).run(JSON.stringify(map), req.user!.email);
    }
    if (Array.isArray(pages)) {
      for (const p of pages) {
        if (p?.slug && typeof p.title === 'string' && typeof p.html === 'string') {
          db.prepare(
            `INSERT INTO pages (slug, title, html) VALUES (?, ?, ?)
             ON CONFLICT(slug) DO UPDATE SET title = excluded.title, html = excluded.html`,
          ).run(p.slug, p.title, p.html);
        }
      }
    }
    if (Array.isArray(users)) {
      for (const u of users) {
        if (u?.email && u?.password_hash && u?.role in ROLE_RANK) {
          db.prepare(
            `INSERT INTO users (email, name, password_hash, role, active)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(email) DO UPDATE SET name = excluded.name, role = excluded.role`,
          ).run(u.email, u.name ?? u.email, u.password_hash, u.role, u.active ? 1 : 0);
        }
      }
    }
  });
  restore();
  logActivity(req.user!.email, 'restore');
  res.json({ ok: true });
});
