import { useCallback, useEffect, useState } from 'react';
import {
  Check,
  Pencil,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  UserX,
  X,
} from 'lucide-react';
import { api, currentUser, type ApiUser } from '../../lib/api';
import { cn, formatDate } from '../../lib/utils';

const ROLES = [
  { value: 'super_admin', label: 'Super Admin', hint: 'Full access incl. backups' },
  { value: 'facility_manager', label: 'Facility Manager', hint: 'Maps + users + pages' },
  { value: 'editor', label: 'Editor', hint: 'Edit and publish maps' },
  { value: 'viewer', label: 'Viewer', hint: 'Read-only API access' },
] as const;

const ROLE_BADGE: Record<string, string> = {
  super_admin: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  facility_manager: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  editor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  viewer: 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300',
};

interface FormState {
  id?: number;
  email: string;
  name: string;
  password: string;
  role: string;
}

const emptyForm: FormState = { email: '', name: '', password: '', role: 'editor' };

/** Backend Mode user management: CRUD, roles, activate/deactivate. */
export default function UsersManager() {
  const [users, setUsers] = useState<ApiUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);
  const me = currentUser();

  const load = useCallback(async () => {
    setError(null);
    try {
      setUsers((await api.listUsers()).users);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setBusy(true);
    setError(null);
    try {
      if (form.id) {
        await api.updateUser(form.id, {
          name: form.name,
          role: form.role,
          ...(form.password ? { password: form.password } : {}),
        });
      } else {
        await api.createUser(form);
      }
      setForm(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (u: ApiUser) => {
    try {
      await api.updateUser(u.id, { active: !u.active });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const remove = async (u: ApiUser) => {
    if (!confirm(`Delete user "${u.name}" (${u.email})? The account is soft-deleted and can't sign in anymore.`))
      return;
    try {
      await api.deleteUser(u.id);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="flex items-center gap-2 text-lg font-bold">
          <Shield className="h-5 w-5" /> Users & roles
        </h1>
        <div className="flex-1" />
        <button type="button" className="btn-ghost !px-3" onClick={load} aria-label="Reload users">
          <RefreshCw className="h-4 w-4" />
        </button>
        <button type="button" className="btn-primary" onClick={() => setForm(emptyForm)}>
          <Plus className="h-4 w-4" /> Invite user
        </button>
      </div>

      {error && (
        <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {/* Create / edit form */}
      {form && (
        <form onSubmit={save} className="card space-y-3 p-5">
          <h2 className="text-sm font-bold">{form.id ? 'Edit user' : 'New user'}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="u-name">Name</label>
              <input id="u-name" className="input" required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="u-email">Email</label>
              <input id="u-email" type="email" className="input" required disabled={Boolean(form.id)}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="u-pass">
                {form.id ? 'New password (leave blank to keep)' : 'Password (min 8 chars)'}
              </label>
              <input id="u-pass" type="password" className="input" minLength={form.password ? 8 : undefined}
                required={!form.id} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="u-role">Role</label>
              <select id="u-role" className="input" value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label} — {r.hint}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={busy}>
              <Check className="h-4 w-4" /> {form.id ? 'Save changes' : 'Create user'}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setForm(null)}>
              <X className="h-4 w-4" /> Cancel
            </button>
          </div>
        </form>
      )}

      {/* User list */}
      <div className="card overflow-hidden">
        {users === null ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-14" />
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-ink-100 dark:divide-ink-800">
            {users.map((u) => (
              <li key={u.id} className={cn('flex flex-wrap items-center gap-3 px-4 py-3', !u.active && 'opacity-50')}>
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-white dark:bg-white dark:text-ink-900"
                  aria-hidden="true"
                >
                  {u.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {u.name}
                    {me?.id === u.id && <span className="ml-1.5 text-xs text-ink-400">(you)</span>}
                  </p>
                  <p className="truncate text-xs text-ink-400">
                    {u.email} · last login {formatDate(u.lastLogin ?? undefined)}
                  </p>
                </div>
                <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide', ROLE_BADGE[u.role])}>
                  {u.role.replace('_', ' ')}
                </span>
                <button type="button" className="btn-ghost !p-2" aria-label={`Edit ${u.name}`}
                  onClick={() => setForm({ id: u.id, email: u.email, name: u.name, password: '', role: u.role })}>
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" className="btn-ghost !p-2" aria-label={u.active ? `Deactivate ${u.name}` : `Activate ${u.name}`}
                  title={u.active ? 'Deactivate' : 'Activate'} disabled={me?.id === u.id}
                  onClick={() => toggleActive(u)}>
                  <UserX className={cn('h-4 w-4', !u.active && 'text-emerald-500')} />
                </button>
                <button type="button" className="btn-ghost !p-2 text-red-500" aria-label={`Delete ${u.name}`}
                  disabled={me?.id === u.id} onClick={() => remove(u)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs leading-relaxed text-ink-400">
        Passwords are bcrypt-hashed on the server; sessions use short-lived JWT access
        tokens with rotating refresh tokens. Deactivating a user or changing their
        password revokes their refresh tokens immediately.
      </p>
    </div>
  );
}
