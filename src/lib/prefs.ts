/**
 * Visitor-side preferences persisted in localStorage only:
 * favorites, recently viewed zones, personal notes and local view counts.
 * Nothing here ever leaves the device.
 */

const FAV_KEY = 'helamap-favorites';
const RECENT_KEY = 'helamap-recents';
const NOTES_KEY = 'helamap-notes';
const VIEWS_KEY = 'helamap-zone-views';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / quota — degrade silently */
  }
}

/* ---------- favorites ---------- */

export function getFavorites(): string[] {
  return read<string[]>(FAV_KEY, []);
}

export function toggleFavorite(zoneId: string): string[] {
  const favs = getFavorites();
  const next = favs.includes(zoneId)
    ? favs.filter((id) => id !== zoneId)
    : [...favs, zoneId];
  write(FAV_KEY, next);
  return next;
}

/* ---------- recently viewed ---------- */

export function getRecents(): string[] {
  return read<string[]>(RECENT_KEY, []);
}

export function pushRecent(zoneId: string): void {
  const next = [zoneId, ...getRecents().filter((id) => id !== zoneId)].slice(0, 8);
  write(RECENT_KEY, next);
}

/* ---------- personal notes ---------- */

export function getNote(zoneId: string): string {
  return read<Record<string, string>>(NOTES_KEY, {})[zoneId] ?? '';
}

export function setNote(zoneId: string, text: string): void {
  const all = read<Record<string, string>>(NOTES_KEY, {});
  if (text.trim()) all[zoneId] = text;
  else delete all[zoneId];
  write(NOTES_KEY, all);
}

/* ---------- local view counts (usage insight for admins) ---------- */

export function bumpViewCount(zoneId: string): void {
  const all = read<Record<string, number>>(VIEWS_KEY, {});
  all[zoneId] = (all[zoneId] ?? 0) + 1;
  write(VIEWS_KEY, all);
}

export function getViewCounts(): Record<string, number> {
  return read<Record<string, number>>(VIEWS_KEY, {});
}
