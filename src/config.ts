/**
 * Client-side admin password. This only deters casual visitors —
 * everything ships to the browser, so treat it as a soft lock, not security.
 * Override with VITE_ADMIN_PASSWORD in a .env file at build time.
 */
export const ADMIN_PASSWORD: string =
  (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined) || 'facility2026';

export const DRAFT_STORAGE_KEY = 'helamap-admin-draft-v1';
export const ADMIN_SESSION_KEY = 'helamap-admin-unlocked';
export const THEME_STORAGE_KEY = 'helamap-theme';

/** Where the static data file lives, relative to the deploy base. */
export const DATA_URL = `${import.meta.env.BASE_URL}data/map-data.json`;
