# Users & Roles (Backend Mode)

| Capability | Viewer | Editor | Facility Manager | Super Admin |
|---|:-:|:-:|:-:|:-:|
| View map via API | ✔ | ✔ | ✔ | ✔ |
| Edit & publish map data | | ✔ | ✔ | ✔ |
| See analytics | | ✔ | ✔ | ✔ |
| Edit legal pages | | | ✔ | ✔ |
| Manage users | | | ✔ (up to their own rank) | ✔ |
| View activity log & contact messages | | | ✔ | ✔ |
| Backup / restore everything | | | | ✔ |

Rules enforced by the API:

- A manager can never create, edit, delete or out-rank an account **above their
  own role** (e.g. a Facility Manager cannot touch a Super Admin).
- You cannot deactivate, demote or delete **your own** account.
- Deactivating a user or changing their password immediately revokes their
  refresh tokens (they are signed out everywhere).
- Deleted users are **soft-deleted**: they can't sign in, but history remains.

Security implementation:

- Passwords: bcrypt (cost 10)
- Sessions: JWT access tokens (15 min) + single-use rotating refresh tokens
  (7 days), stored **hashed** in SQLite
- Login endpoint rate-limited (10 attempts / 15 min / IP)
- `helmet` security headers, strict CORS allow-list, global rate limiting
