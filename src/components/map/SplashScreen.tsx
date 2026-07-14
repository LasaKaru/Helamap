import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useI18n } from '../../lib/i18n';

/** Full-screen hero loading animation shown while map data streams in. */
export default function SplashScreen({ error }: { error?: string | null }) {
  const { t } = useI18n();
  return (
    <div className="ambient-grid fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink-50 dark:bg-ink-950">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 14, stiffness: 160 }}
        className="relative"
      >
        <div className="absolute inset-0 rounded-3xl bg-blue-500/40 blur-2xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-glass">
          <MapPin className="h-10 w-10" strokeWidth={2.2} />
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-8 text-sm font-semibold tracking-wide text-ink-500 dark:text-ink-400"
      >
        {error ? 'Something went wrong' : t.loading}
      </motion.p>

      {error ? (
        <p className="mt-3 max-w-xs text-center text-sm text-red-500">{error}</p>
      ) : (
        <div className="mt-5 h-1 w-44 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
          <motion.div
            className="h-full rounded-full bg-blue-500"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
            style={{ width: '55%' }}
          />
        </div>
      )}
    </div>
  );
}
