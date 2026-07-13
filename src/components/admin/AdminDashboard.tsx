import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  Clock,
  FileJson,
  Layers,
  MapPin,
  Pencil,
  Settings,
} from 'lucide-react';
import type { AdminDraft } from '../../hooks/useAdminDraft';
import { countStats } from '../../lib/data';
import { formatDate } from '../../lib/utils';

export default function AdminDashboard({
  draft,
  onNavigate,
}: {
  draft: AdminDraft;
  onNavigate: (tab: string) => void;
}) {
  const data = draft.data!;
  const stats = countStats(data);

  const cards = [
    { label: 'Buildings', value: stats.buildings, icon: <Building2 className="h-5 w-5" />, color: 'text-blue-500 bg-blue-500/10' },
    { label: 'Floors', value: stats.floors, icon: <Layers className="h-5 w-5" />, color: 'text-emerald-500 bg-emerald-500/10' },
    { label: 'Zones', value: stats.zones, icon: <MapPin className="h-5 w-5" />, color: 'text-amber-500 bg-amber-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Welcome back 👋</h1>
        <p className="mt-1 text-sm text-ink-500">
          Manage {data.companyName}'s facility map. Changes stay in a local draft
          until you export the JSON file.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="card p-4"
          >
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${c.color}`}>
              {c.icon}
            </div>
            <p className="mt-3 text-2xl font-extrabold">{c.value}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              {c.label}
            </p>
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="card p-4"
        >
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
            <Clock className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-bold leading-snug">{formatDate(draft.lastExport ?? undefined)}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
            Last export
          </p>
        </motion.div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <QuickAction
          title="Company & branding"
          text="Set the company name, logo, colors and contact details."
          icon={<Settings className="h-5 w-5" />}
          onClick={() => onNavigate('settings')}
        />
        <QuickAction
          title="Edit buildings & zones"
          text="Add floors, draw zone polygons, write safety notes."
          icon={<Pencil className="h-5 w-5" />}
          onClick={() => onNavigate('content')}
        />
        <QuickAction
          title="Export map-data.json"
          text="Download the updated file and replace it on your host."
          icon={<FileJson className="h-5 w-5" />}
          onClick={() => onNavigate('export')}
        />
      </div>

      {/* Workflow reminder */}
      <div className="card p-5">
        <h2 className="text-sm font-bold">How publishing works</h2>
        <ol className="mt-3 space-y-2 text-sm text-ink-500">
          <li><b className="text-ink-700 dark:text-ink-200">1. Edit</b> — every change is auto-saved as a browser draft (nothing is public yet).</li>
          <li><b className="text-ink-700 dark:text-ink-200">2. Export</b> — download the fresh <code className="rounded bg-ink-100 dark:bg-ink-800 px-1.5 py-0.5 text-xs">map-data.json</code>.</li>
          <li><b className="text-ink-700 dark:text-ink-200">3. Replace</b> — overwrite <code className="rounded bg-ink-100 dark:bg-ink-800 px-1.5 py-0.5 text-xs">/data/map-data.json</code> on your static host. The next QR scan shows the update instantly.</li>
        </ol>
      </div>
    </div>
  );
}

function QuickAction({
  title,
  text,
  icon,
  onClick,
}: {
  title: string;
  text: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card group p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-glass"
    >
      <div className="flex items-center justify-between">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-white dark:bg-white dark:text-ink-900">
          {icon}
        </div>
        <ArrowRight className="h-4 w-4 text-ink-300 transition-transform group-hover:translate-x-1" />
      </div>
      <h3 className="mt-4 text-sm font-bold">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-ink-500">{text}</p>
    </button>
  );
}
