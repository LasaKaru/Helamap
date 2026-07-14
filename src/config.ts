import bcrypt from 'bcryptjs';

/**
 * Static Mode admin password. This only deters casual visitors — everything
 * ships to the browser, so treat it as a soft lock, not security. For real
 * multi-user security, enable Backend Mode.
 *
 * Preferred: set VITE_ADMIN_PASSWORD_HASH to a bcrypt hash (generate with
 * `npx bcrypt-cli hash "yourpass"` or any bcrypt tool) so the plain password
 * never appears in the bundle. VITE_ADMIN_PASSWORD (plain) is also supported
 * for convenience. Default password: facility2026
 */
const PASSWORD_HASH: string =
  (import.meta.env.VITE_ADMIN_PASSWORD_HASH as string | undefined) ||
  // bcrypt hash of "facility2026"
  '$2b$10$b8n7lw90wHfvoAD9KMZRjuFTIvdkJiiB9w3IM6UgkJUzKcZ5RSRmq';

const PASSWORD_PLAIN: string | undefined = import.meta.env.VITE_ADMIN_PASSWORD as
  | string
  | undefined;

export function verifyStaticPassword(input: string): boolean {
  if (PASSWORD_PLAIN) return input === PASSWORD_PLAIN;
  try {
    return bcrypt.compareSync(input, PASSWORD_HASH);
  } catch {
    return false;
  }
}

export const DRAFT_STORAGE_KEY = 'helamap-admin-draft-v1';
export const ADMIN_SESSION_KEY = 'helamap-admin-unlocked';
export const THEME_STORAGE_KEY = 'helamap-theme';

/** Where the static data file lives, relative to the deploy base. */
export const DATA_URL = `${import.meta.env.BASE_URL}data/map-data.json`;
