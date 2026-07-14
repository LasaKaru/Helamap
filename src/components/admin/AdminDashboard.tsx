import { useEffect, useMemo, useState } from 'react';
import { animate, motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Building2,
  Circle,
  Clapperboard,
  Clock,
  FileJson,
  Layers,
  MapPin,
  Pencil,
  Settings,
} from 'lucide-react';
import type { AdminDraft } from '../../hooks/useAdminDraft';
import { allZones, countStats } from '../../lib/data';
import { getViewCounts } from '../../lib/prefs';
import { api } from '../../lib/api';
import { ZoneIcon } from '../../lib/icons';
import { assetUrl, formatDate } from '../../lib/utils';

/**
 * Cinematic "shoot view" dashboard: a widescreen dark hero with a slow
 * Ken Burns pan across the facility floor plan, film-slate timecode,
 * count-up stats, and scene-numbered action cards. Deliberately dark in
 * both themes — like a director's monitor.
 */
export default function AdminDashboard({
  draft,
  onNavigate,
}: {
  draft: AdminDraft;
  onNavigate: (tab: string) => void;
}) {
  const data = draft.data!;
  const stats = countStats(data);
  const heroImage = assetUrl(data.buildings[0]?.floors[0]?.mapImage);

  const scenes = [
    {
      no: '02',
      title: 'Company & branding',
      text: 'Logo, colors, SEO and contact details.',
      icon: <Settings className="h-5 w-5" />,
      tab: 'settings',
      glow: 'from-blue-500/40',
    },
    {
      no: '03',
      title: 'Buildings & zones',
      text: 'Draw polygons, write safety notes, add floors.',
      icon: <Pencil className="h-5 w-5" />,
      tab: 'content',
      glow: 'from-amber-500/40',
    },
    {
      no: '04',
      title: draft.backendMode ? 'Publish the cut' : 'Export the cut',
      text: draft.backendMode
        ? 'Push the draft live to the server in one click.'
        : 'Download map-data.json and replace it on your host.',
      icon: <FileJson className="h-5 w-5" />,
      tab: 'export',
      glow: 'from-emerald-500/40',
    },
  ];

  return (
    <div className="space-y-5">
      {/* ── SCENE 01 · the hero shot ─────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-ink-950 text-white shadow-glass"
      >
        {/* Ken Burns floor plan backdrop */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          {heroImage && (
            <motion.img
              src={heroImage}
              alt=""
              className="h-full w-full object-cover opacity-25 saturate-50"
              initial={{ scale: 1.08, x: '-1.5%', y: '-1%' }}
              animate={{ scale: 1.22, x: '2%', y: '2%' }}
              transition={{ duration: 26, ease: 'linear', repeat: Infinity, repeatType: 'mirror' }}
            />
          )}
          {/* vignette + spotlight */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_90%_at_28%_20%,rgba(59,130,246,0.28),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_120%_at_50%_50%,transparent_40%,rgba(2,6,16,0.9)_100%)]" />
          <div className="film-grain absolute inset-0" />
          {/* letterbox bars */}
          <div className="absolute inset-x-0 top-0 h-6 bg-black/60" />
          <div className="absolute inset-x-0 bottom-0 h-6 bg-black/60" />
        </div>

        <div className="relative px-6 py-10 sm:px-10 sm:py-12">
          {/* film slate row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] tracking-[0.25em] text-white/60">
            <span className="flex items-center gap-2 text-red-400">
              <Circle className="h-2.5 w-2.5 animate-pulse fill-red-500 text-red-500" />
              REC
            </span>
            <span>SCENE 01 · FACILITY OVERVIEW</span>
            <Timecode />
            <span className="hidden sm:inline">
              {draft.backendMode ? 'BACKEND MODE' : 'STATIC MODE'}
            </span>
          </div>

          <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-300/90">
                <Clapperboard className="h-4 w-4" />
                Now showing
              </p>
              <h1 className="mt-2 max-w-xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                {data.companyName}
              </h1>
              <p className="mt-2 text-sm text-white/60">
                {data.tagline || 'Your facility, mapped.'} · Updated{' '}
                {formatDate(data.lastUpdated)}
              </p>
            </div>

            {/* count-up stat chips */}
            <div className="flex flex-wrap gap-3">
              <HeroStat icon={<Building2 className="h-4 w-4" />} value={stats.buildings} label="Buildings" />
              <HeroStat icon={<Layers className="h-4 w-4" />} value={stats.floors} label="Floors" />
              <HeroStat icon={<MapPin className="h-4 w-4" />} value={stats.zones} label="Zones" />
              <HeroStat
                icon={<Clock className="h-4 w-4" />}
                label="Last export"
                text={draft.lastExport ? formatDate(draft.lastExport).split(',')[0] : '—'}
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── scene cards ─────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {scenes.map((s, i) => (
          <motion.button
            key={s.no}
            type="button"
            onClick={() => onNavigate(s.tab)}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className="group relative overflow-hidden rounded-2xl bg-ink-950 p-5 text-left text-white shadow-glass transition-transform hover:-translate-y-1"
          >
            <div
              className={`pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br ${s.glow} to-transparent blur-2xl opacity-60 transition-opacity group-hover:opacity-100`}
              aria-hidden="true"
            />
            <p className="font-mono text-[10px] tracking-[0.3em] text-white/40">
              SCENE {s.no}
            </p>
            <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              {s.icon}
            </div>
            <h3 className="mt-4 text-sm font-bold">{s.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-white/50">{s.text}</p>
            <ArrowRight className="mt-4 h-4 w-4 text-white/40 transition-transform group-hover:translate-x-1.5 group-hover:text-white" />
          </motion.button>
        ))}
      </div>

      <MostViewed draft={draft} />

      {/* ── production pipeline ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="overflow-hidden rounded-2xl bg-ink-950 p-6 text-white shadow-glass"
      >
        <p className="font-mono text-[10px] tracking-[0.3em] text-white/40">PRODUCTION PIPELINE</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            ['Pre-production', 'Edit buildings, zones and branding — every change auto-saves as a local draft.'],
            ['The shoot', draft.backendMode ? 'Hit Publish now — the draft goes straight to the server.' : 'Export a fresh map-data.json when the cut is ready.'],
            ['Release', draft.backendMode ? 'Visitors see the update on their next scan. That’s a wrap.' : 'Replace data/map-data.json on your host. Next scan shows the update.'],
          ].map(([title, text], i) => (
            <div key={title} className="relative pl-4">
              <span
                className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-blue-400/70 to-transparent"
                aria-hidden="true"
              />
              <p className="font-mono text-[10px] text-blue-300/80">{String(i + 1).padStart(2, '0')}</p>
              <p className="mt-1 text-sm font-bold">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/50">{text}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ── pieces ─────────────────────────────────────────────────────── */

/** Live HH:MM:SS:FF timecode, 25 fps — the little director's-monitor touch. */
function Timecode() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 40);
    return () => clearInterval(t);
  }, []);
  const pad = (n: number) => String(n).padStart(2, '0');
  const frames = pad(Math.floor(now.getMilliseconds() / 40));
  return (
    <span className="tabular-nums" aria-hidden="true">
      TC {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}:{frames}
    </span>
  );
}

function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.1,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value]);
  return <>{display}</>;
}

function HeroStat({
  icon,
  value,
  text,
  label,
}: {
  icon: React.ReactNode;
  value?: number;
  text?: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-1.5 text-white/50">{icon}</div>
      <p className="mt-1.5 text-2xl font-extrabold tabular-nums leading-none">
        {value !== undefined ? <CountUp value={value} /> : <span className="text-sm">{text}</span>}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
        {label}
      </p>
    </div>
  );
}

/**
 * Top zones chart. Backend Mode pulls real server analytics; Static Mode
 * falls back to the view counts recorded in this browser.
 */
function MostViewed({ draft }: { draft: AdminDraft }) {
  const [serverTotals, setServerTotals] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    if (!draft.backendMode) return;
    api
      .getAnalytics()
      .then((res) =>
        setServerTotals(Object.fromEntries(res.totals.map((t) => [t.zoneId, t.views]))),
      )
      .catch(() => setServerTotals(null));
  }, [draft.backendMode]);

  const rows = useMemo(() => {
    const counts = serverTotals ?? getViewCounts();
    return allZones(draft.data!)
      .map((r) => ({ r, n: counts[r.zone.id] ?? 0 }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n)
      .slice(0, 5);
  }, [draft.data, serverTotals]);

  if (rows.length === 0) return null;
  const max = rows[0].n;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="overflow-hidden rounded-2xl bg-ink-950 p-6 text-white shadow-glass"
    >
      <h2 className="flex flex-wrap items-center gap-2 font-mono text-[10px] tracking-[0.3em] text-white/40">
        <BarChart3 className="h-3.5 w-3.5" /> AUDIENCE · MOST VIEWED ZONES
        <span className="rounded bg-white/10 px-1.5 py-0.5 tracking-normal">
          {serverTotals ? 'server analytics' : 'this browser only'}
        </span>
      </h2>
      <ul className="mt-5 space-y-3">
        {rows.map(({ r, n }, i) => (
          <li key={r.zone.id} className="flex items-center gap-3">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: r.zone.color }}
            >
              <ZoneIcon name={r.zone.icon} className="h-4 w-4" />
            </span>
            <span className="w-40 truncate text-xs font-semibold">{r.zone.name}</span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <motion.span
                className="block h-full rounded-full"
                style={{
                  backgroundColor: r.zone.color,
                  boxShadow: `0 0 12px ${r.zone.color}`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${(n / max) * 100}%` }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.7, ease: 'easeOut' }}
              />
            </span>
            <span className="w-10 text-right font-mono text-xs font-bold text-white/70">{n}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
