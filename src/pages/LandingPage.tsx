import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Clock,
  Compass,
  Lock,
  Map as MapIcon,
  QrCode,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Star,
} from 'lucide-react';
import { useMapData } from '../hooks/useMapData';
import { allZones, countStats } from '../lib/data';
import { getFavorites, getRecents } from '../lib/prefs';
import { useI18n } from '../lib/i18n';
import { ZoneIcon } from '../lib/icons';
import Logo from '../components/ui/Logo';
import ThemeToggle from '../components/ui/ThemeToggle';
import SiteFooter from '../components/ui/SiteFooter';
import Seo, { organizationJsonLd } from '../components/ui/Seo';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  const { data } = useMapData();
  const stats = data ? countStats(data) : null;

  return (
    <div className="ambient-grid min-h-screen">
      <Seo settings={data} jsonLd={data ? organizationJsonLd(data) : undefined} />
      {/* Nav */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-3">
          <Logo settings={data} />
          <div>
            <p className="text-sm font-bold leading-tight">
              {data?.appName ?? 'HelaMap'}
            </p>
            <p className="text-[11px] text-ink-500 leading-tight">
              {data?.companyName ?? ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Link to="/admin" className="btn-ghost !px-3" aria-label="Admin panel">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-5xl px-5 pb-20">
        <section className="pt-10 sm:pt-20 text-center">
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="mx-auto inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400"
          >
            <ScanLine className="h-3.5 w-3.5" />
            Scan the QR code at the entrance
          </motion.div>

          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="mx-auto mt-6 max-w-2xl text-4xl sm:text-6xl font-extrabold tracking-tight"
          >
            Find your way,
            <span className="bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              {' '}
              from day one.
            </span>
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="mx-auto mt-5 max-w-xl text-base sm:text-lg text-ink-500 dark:text-ink-400"
          >
            {data?.welcomeMessage ??
              'An interactive facility map for new hires and daily staff. Pan, zoom and tap any zone to see what happens there, who to contact, and what safety gear you need.'}
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link to="/map" className="btn-primary !px-6 !py-3 !text-base">
              <MapIcon className="h-5 w-5" />
              Open the map
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/qr" className="btn-outline !px-6 !py-3 !text-base">
              <QrCode className="h-5 w-5" />
              QR codes
            </Link>
          </motion.div>

          {stats && (
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.32 }}
              className="mx-auto mt-12 grid max-w-md grid-cols-3 gap-3"
            >
              <Stat value={stats.buildings} label="Buildings" />
              <Stat value={stats.floors} label="Floors" />
              <Stat value={stats.zones} label="Zones" />
            </motion.div>
          )}

          {data && <SavedZones data={data} />}
        </section>

        {/* Features */}
        <section className="mt-20 grid gap-4 sm:grid-cols-3">
          <Feature
            icon={<Smartphone className="h-5 w-5" />}
            title="Instant on mobile"
            text="Opens in the browser the moment a QR code is scanned. No app installs, no accounts, works offline-friendly."
            delay={0}
          />
          <Feature
            icon={<Compass className="h-5 w-5" />}
            title="Tap-to-explore zones"
            text="Every area — inventory, planning, assembly, canteen — is tappable with contacts, photos and details."
            delay={0.1}
          />
          <Feature
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Safety first"
            text="PPE requirements and hazard notes surface right where people need them, before they walk in."
            delay={0.2}
          />
        </section>

        {/* How it works */}
        <section className="card mt-16 p-6 sm:p-8">
          <h2 className="text-lg font-bold">How it works</h2>
          <ol className="mt-5 grid gap-5 sm:grid-cols-3">
            {[
              ['Scan', 'A QR code at the entrance (or any zone) opens the live map at that exact spot.'],
              ['Explore', 'Pinch, zoom and tap zones for descriptions, contacts and safety notes.'],
              ['Navigate', 'Follow the animated route from where you stand to where you need to be.'],
            ].map(([title, text], i) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-sm font-bold text-blue-600 dark:text-blue-400">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <SiteFooter settings={data} />
    </div>
  );
}

/** Starred + recently viewed zones from this device, as one-tap map links. */
function SavedZones({ data }: { data: NonNullable<ReturnType<typeof useMapData>['data']> }) {
  const { t } = useI18n();
  const entries = useMemo(() => {
    const byId = new Map(allZones(data).map((r) => [r.zone.id, r]));
    const favs = getFavorites()
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((r) => ({ r: r!, fav: true }));
    const favIds = new Set(favs.map((e) => e.r.zone.id));
    const recents = getRecents()
      .filter((id) => !favIds.has(id))
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((r) => ({ r: r!, fav: false }));
    return [...favs, ...recents].slice(0, 6);
  }, [data]);

  if (entries.length === 0) return null;

  return (
    <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.4 }} className="mt-10">
      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
        {t.favorites} · {t.recent}
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {entries.map(({ r, fav }) => (
          <Link
            key={r.zone.id}
            to={`/map?building=${r.building.id}&floor=${r.floor.id}&zone=${r.zone.id}`}
            className="glass flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 text-xs font-semibold transition-transform hover:scale-105"
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: r.zone.color }}
            >
              <ZoneIcon name={r.zone.icon} className="h-3.5 w-3.5" />
            </span>
            {r.zone.shortName}
            {fav ? (
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            ) : (
              <Clock className="h-3 w-3 text-ink-400" />
            )}
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="glass rounded-2xl px-4 py-3.5">
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
        {label}
      </p>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay }}
      className="card p-6"
    >
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
        {icon}
      </div>
      <h3 className="mt-4 font-bold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{text}</p>
    </motion.div>
  );
}
