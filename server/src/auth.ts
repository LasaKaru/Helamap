import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { config } from './config.js';
import { db, type UserRow } from './db.js';

export type Role = UserRow['role'];

/** Higher rank = more privileges. */
export const ROLE_RANK: Record<Role, number> = {
  viewer: 1,
  editor: 2,
  facility_manager: 3,
  super_admin: 4,
};

export interface AuthedRequest extends Request {
  user?: { id: number; email: string; role: Role };
}

export function signAccessToken(user: { id: number; email: string; role: Role }): string {
  return jwt.sign({ sub: String(user.id), email: user.email, role: user.role }, config.accessSecret, {
    expiresIn: config.accessTtl as jwt.SignOptions['expiresIn'],
  });
}

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

/** Issue a rotating refresh token, stored hashed so a DB leak can't replay it. */
export function issueRefreshToken(userId: number): string {
  const token = crypto.randomBytes(48).toString('hex');
  const expires = new Date(Date.now() + config.refreshTtlDays * 86400_000).toISOString();
  db.prepare('INSERT INTO refresh_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(
    hashToken(token),
    userId,
    expires,
  );
  db.prepare("DELETE FROM refresh_tokens WHERE expires_at < datetime('now')").run();
  return token;
}

export function consumeRefreshToken(token: string): UserRow | null {
  const row = db
    .prepare(
      `SELECT u.* FROM refresh_tokens rt JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = ? AND rt.expires_at > datetime('now')
         AND u.deleted = 0 AND u.active = 1`,
    )
    .get(hashToken(token)) as UserRow | undefined;
  // Rotate: a refresh token is single-use.
  db.prepare('DELETE FROM refresh_tokens WHERE token_hash = ?').run(hashToken(token));
  return row ?? null;
}

export function revokeRefreshToken(token: string): void {
  db.prepare('DELETE FROM refresh_tokens WHERE token_hash = ?').run(hashToken(token));
}

/** Express middleware requiring a valid access token with at least `minRole`. */
export function requireRole(minRole: Role) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing access token' });
    try {
      const payload = jwt.verify(token, config.accessSecret) as jwt.JwtPayload;
      const role = payload.role as Role;
      if (ROLE_RANK[role] < ROLE_RANK[minRole])
        return res.status(403).json({ error: 'Insufficient permissions' });
      req.user = { id: Number(payload.sub), email: String(payload.email), role };
      next();
    } catch {
      return res.status(401).json({ error: 'Invalid or expired access token' });
    }
  };
}
