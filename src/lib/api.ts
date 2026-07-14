/**
 * FacilityFlow backend client (Pro / Backend Mode).
 *
 * The frontend is static-first: backend mode is opt-in via Admin → Settings.
 * The chosen URL + enabled flag live in localStorage; every consumer asks
 * this module instead of talking to fetch directly, so the whole app flips
 * between JSON-file mode and REST mode from one switch.
 */
import type { MapData } from '../types';

const BACKEND_SETTINGS_KEY = 'facilityflow-backend';
const TOKENS_KEY = 'facilityflow-tokens';

export interface BackendSettings {
  enabled: boolean;
  url: string; // e.g. http://localhost:4000
}

export interface ApiUser {
  id: number;
  email: string;
  name: string;
  role: 'super_admin' | 'facility_manager' | 'editor' | 'viewer';
  active: boolean;
  lastLogin: string | null;
  createdAt: string;
}

export interface ApiPage {
  slug: string;
  title: string;
  html: string;
  updated_at?: string;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
}

export function getBackendSettings(): BackendSettings {
  try {
    const raw = localStorage.getItem(BACKEND_SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as BackendSettings;
  } catch {
    /* fall through */
  }
  return { enabled: false, url: 'http://localhost:4000' };
}

export function setBackendSettings(settings: BackendSettings): void {
  localStorage.setItem(BACKEND_SETTINGS_KEY, JSON.stringify(settings));
}

export function backendEnabled(): boolean {
  return getBackendSettings().enabled;
}

function apiBase(): string {
  return getBackendSettings().url.replace(/\/$/, '');
}

function getTokens(): Tokens | null {
  try {
    const raw = localStorage.getItem(TOKENS_KEY);
    return raw ? (JSON.parse(raw) as Tokens) : null;
  } catch {
    return null;
  }
}

function setTokens(tokens: Tokens | null): void {
  if (tokens) localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  else localStorage.removeItem(TOKENS_KEY);
}

export function currentUser(): ApiUser | null {
  return getTokens()?.user ?? null;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** Core request helper with automatic single-retry access-token refresh. */
async function request<T>(
  path: string,
  options: RequestInit = {},
  retryOnAuthFail = true,
): Promise<T> {
  const tokens = getTokens();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };
  if (tokens) headers.Authorization = `Bearer ${tokens.accessToken}`;

  const res = await fetch(`${apiBase()}/api${path}`, { ...options, headers });

  if (res.status === 401 && tokens && retryOnAuthFail) {
    const refreshed = await tryRefresh(tokens.refreshToken);
    if (refreshed) return request<T>(path, options, false);
    setTokens(null);
    throw new ApiError('Session expired — please sign in again', 401);
  }

  const body = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) throw new ApiError(body.error ?? `Request failed (HTTP ${res.status})`, res.status);
  return body as T;
}

async function tryRefresh(refreshToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${apiBase()}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    setTokens((await res.json()) as Tokens);
    return true;
  } catch {
    return false;
  }
}

/* ─────────────────────────── public API surface ─────────────────────────── */

export const api = {
  /** Fast availability probe — used for auto-detection and fallback. */
  async health(timeoutMs = 3500): Promise<boolean> {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(`${apiBase()}/api/health`, { signal: ctrl.signal });
      clearTimeout(timer);
      return res.ok;
    } catch {
      return false;
    }
  },

  async login(email: string, password: string): Promise<ApiUser> {
    const res = await fetch(`${apiBase()}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = (await res.json().catch(() => ({}))) as Tokens & { error?: string };
    if (!res.ok) throw new ApiError(body.error ?? 'Login failed', res.status);
    setTokens(body);
    return body.user;
  },

  async logout(): Promise<void> {
    const tokens = getTokens();
    setTokens(null);
    if (tokens) {
      await fetch(`${apiBase()}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      }).catch(() => undefined);
    }
  },

  isAuthenticated(): boolean {
    return getTokens() !== null;
  },

  getMap: () => request<MapData>('/map'),
  saveMap: (data: MapData) =>
    request<{ ok: boolean }>('/map', { method: 'PUT', body: JSON.stringify(data) }),
  getMapVersions: () =>
    request<{ versions: { id: number; created_at: string; created_by: string; size: number }[] }>(
      '/map/versions',
    ),
  getMapVersion: (id: number) => request<MapData>(`/map/versions/${id}`),

  listUsers: () => request<{ users: ApiUser[] }>('/users'),
  createUser: (u: { email: string; name: string; password: string; role: string }) =>
    request<{ user: ApiUser }>('/users', { method: 'POST', body: JSON.stringify(u) }),
  updateUser: (
    id: number,
    patch: Partial<{ name: string; role: string; active: boolean; password: string }>,
  ) => request<{ user: ApiUser }>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),
  deleteUser: (id: number) => request<{ ok: boolean }>(`/users/${id}`, { method: 'DELETE' }),

  getPage: (slug: string) => request<{ page: ApiPage }>(`/pages/${slug}`),
  savePage: (slug: string, page: { title: string; html: string }) =>
    request<{ ok: boolean }>(`/pages/${slug}`, { method: 'PUT', body: JSON.stringify(page) }),

  trackView(zoneId: string): void {
    // Fire-and-forget — analytics must never slow the map down.
    fetch(`${apiBase()}/api/analytics/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zoneId }),
      keepalive: true,
    }).catch(() => undefined);
  },
  getAnalytics: () =>
    request<{ totals: { zoneId: string; views: number }[]; last14: { day: string; views: number }[] }>(
      '/analytics',
    ),

  sendContact: (msg: { name: string; email: string; message: string }) =>
    request<{ ok: boolean }>('/contact', { method: 'POST', body: JSON.stringify(msg) }),

  downloadBackup: () => request<Record<string, unknown>>('/backup'),
};
