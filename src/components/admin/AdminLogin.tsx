import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, KeyRound, Lock, Mail, Server, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { verifyStaticPassword } from '../../config';
import { api, backendEnabled } from '../../lib/api';

/**
 * Dual-mode gate:
 *  - Static Mode → single admin password (bcrypt-checked client side)
 *  - Backend Mode → email + password against the API (JWT)
 * If Backend Mode is on but the API is down, the admin can still fall back
 * to the static password to reach settings and fix the URL.
 */
export default function AdminLogin({ onUnlock }: { onUnlock: () => void }) {
  const [useBackend, setUseBackend] = useState(backendEnabled());
  const [apiUp, setApiUp] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (backendEnabled()) api.health().then(setApiUp);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (useBackend) {
      setBusy(true);
      try {
        await api.login(email.trim(), password);
        onUnlock();
      } catch (err) {
        setError((err as Error).message);
        setPassword('');
      } finally {
        setBusy(false);
      }
    } else if (verifyStaticPassword(password)) {
      onUnlock();
    } else {
      setError('Wrong password — try again.');
      setPassword('');
    }
  };

  return (
    <div className="ambient-grid flex min-h-screen items-center justify-center p-5">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 20 }}
        animate={error ? { x: [0, -12, 12, -8, 8, 0], opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card w-full max-w-sm p-8"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-900 text-white dark:bg-white dark:text-ink-900">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-center text-xl font-bold">Admin panel</h1>
        <p className="mt-1.5 text-center text-sm text-ink-500">
          {useBackend
            ? 'Sign in with your FacilityFlow account.'
            : 'Enter the admin password to manage the facility map.'}
        </p>

        {backendEnabled() && apiUp === false && useBackend && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <WifiOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            The backend is unreachable. You can still unlock with the static admin password.
          </p>
        )}

        {useBackend && (
          <>
            <label className="label mt-6" htmlFor="admin-email">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                id="admin-email"
                type="email"
                autoFocus
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input !pl-10"
                placeholder="you@company.com"
              />
            </div>
          </>
        )}

        <label className="label mt-4" htmlFor="admin-password">Password</label>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            id="admin-password"
            type="password"
            autoFocus={!useBackend}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input !pl-10"
            placeholder="••••••••••"
            aria-invalid={Boolean(error)}
          />
        </div>
        {error && (
          <p className="mt-2 text-xs font-semibold text-red-500" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary mt-5 w-full" disabled={busy}>
          {busy ? 'Signing in…' : 'Unlock'}
        </button>

        {backendEnabled() && (
          <button
            type="button"
            onClick={() => {
              setUseBackend((v) => !v);
              setError(null);
            }}
            className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-ink-400 hover:text-ink-600"
          >
            <Server className="h-3.5 w-3.5" />
            {useBackend ? 'Use the static admin password instead' : 'Sign in with a backend account'}
          </button>
        )}

        <Link
          to="/"
          className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-ink-400 hover:text-ink-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to the map
        </Link>
      </motion.form>
    </div>
  );
}
