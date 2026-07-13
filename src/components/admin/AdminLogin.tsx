import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, KeyRound, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ADMIN_PASSWORD } from '../../config';

export default function AdminLogin({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('');
  const [failed, setFailed] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      onUnlock();
    } else {
      setFailed(true);
      setPassword('');
      setTimeout(() => setFailed(false), 600);
    }
  };

  return (
    <div className="ambient-grid flex min-h-screen items-center justify-center p-5">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 20 }}
        animate={
          failed
            ? { x: [0, -12, 12, -8, 8, 0], opacity: 1, y: 0 }
            : { opacity: 1, y: 0 }
        }
        transition={failed ? { duration: 0.4 } : { duration: 0.4 }}
        className="card w-full max-w-sm p-8"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-900 text-white dark:bg-white dark:text-ink-900">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-center text-xl font-bold">Admin panel</h1>
        <p className="mt-1.5 text-center text-sm text-ink-500">
          Enter the admin password to manage the facility map.
        </p>

        <label className="label mt-6" htmlFor="admin-password">Password</label>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            id="admin-password"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input !pl-10"
            placeholder="••••••••••"
            aria-invalid={failed}
          />
        </div>
        {failed && (
          <p className="mt-2 text-xs font-semibold text-red-500" role="alert">
            Wrong password — try again.
          </p>
        )}

        <button type="submit" className="btn-primary mt-5 w-full">
          Unlock
        </button>
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
