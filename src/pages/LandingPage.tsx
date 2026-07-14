import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  Circle,
  Clapperboard,
  Clock,
  Compass,
  Layers,
  Lock,
  Map as MapIcon,
  MapPin,
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
import { assetUrl } from '../lib/utils';
import Logo from '../components/ui/Logo';
import ThemeToggle from '../components/ui/ThemeToggle';
import SiteFooter from '../components/ui/SiteFooter';
import Seo, { organizationJsonLd } from '../components/ui/Seo';
import { HeroStat, Timecode } from '../components/ui/cinematic';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

/**
 * Cinematic landing: the same director's-monitor language as the admin
 * dashboard — Ken Burns floor plan hero, REC slate + timecode, count-up
 * stats, scene-numbered feature cards and a pipeline "how it works".
 */
export default function LandingPage() {
  const { data } = useMapData();
  const stats = data ? countStats(data) : null;
  const heroImage = assetUrl(data?.buildings[0]?.floors[0]?.mapImage);

  return (
    <div className="ambient-grid min-h-screen">
      <Seo settings={data} jsonLd={data ? organizationJsonLd(data) : undefined} />

      {/* Nav */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-3">
          <Logo settings={data} />
          <div>
            <p className="text-sm font-bold leading-tight">{data?.appName ?? 'FacilityFlow'}</p>
            <p className="text-[11px] text-ink-500 leading-tight">{data?.companyName ?? ''}</p>
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

      <main className="mx-auto max-w-5xl px-5 pb-20">
        {/* ── SCENE 01 · cinematic hero ─────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="relative mt-2 overflow-hidden rounded-3xl bg-ink-950 text-white shadow-glass"
        >
          {/* Ken Burns backdrop */}
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            {heroImage && (
              <motion.img
                src={heroImage}
                alt=""
                className="h-full w-full object-cover opacity-[0.16] invert saturate-0"
                initial={{ scale: 1.08, x: '1.5%', y: '-1%' }}
                animate={{ scale: 1.22, x: '-2%', y: '2%' }}
                transition={{ duration: 28, ease: 'linear', repeat: Infinity, repeatType: 'mirror' }}
              />
            )}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_90%_at_70%_15%,rgba(59,130,246,0.3),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_15%_85%,rgba(16,185,129,0.18),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_120%_at_50%_50%,transparent_40%,rgba(2,6,16,0.9)_100%)]" />
            <div className="film-grain absolute inset-0" />
            <div className="absolute inset-x-0 top-0 h-6 bg-black/60" />
            <div className="absolute inset-x-0 bottom-0 h-6 bg-black/60" />
          </div>

          <div className="relative px-6 py-12 sm:px-12 sm:py-16">
            {/* slate row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] tracking-[0.25em] text-white/60">
              <span className="flex items-center gap-2 text-red-400">
                <Circle className="h-2.5 w-2.5 animate-pulse fill-red-500 text-red-500" />
                REC
              </span>
              <span>SCENE 01 · WELCOME ABOARD</span>
              <Timecode />
            </div>

            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-10 inline-flex items-center gap-2 rounded-full border border-blue-400/40 bg-blue-500/15 px-4 py-1.5 text-xs font-semibold text-blue-300"
            >
              <ScanLine className="h-3.5 w-3.5" />
              Scan the QR code at the entrance
            </motion.div>

            <motion.h1
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="mt-5 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-6xl"
            >
              Find your way,
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                {' '}
                from day one.
              </span>
            </motion.h1>

            <motion.p
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.26 }}
              className="mt-5 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg"
            >
              {data?.welcomeMessage ??
                'An interactive facility map for new hires and daily staff. Pan, zoom and tap any zone to see what happens there, who to contact, and what safety gear you need.'}
            </motion.p>

            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.34 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link to="/map" className="btn-primary !px-6 !py-3 !text-base">
                <MapIcon className="h-5 w-5" />
                Open the map
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/qr"
                className="btn !border !border-white/20 !bg-white/10 !px-6 !py-3 !text-base !text-white backdrop-blur hover:!bg-white/20"
              >
                <QrCode className="h-5 w-5" />
                QR codes
              </Link>
            </motion.div>

            {stats && (
              <motion.div
                {...fadeUp}
                transition={{ duration: 0.5, delay: 0.42 }}
                className="mt-10 flex flex-wrap gap-3"
              >
                <HeroStat icon={<Building2 className="h-4 w-4" />} value={stats.buildings} label="Buildings" />
                <HeroStat icon={<Layers className="h-4 w-4" />} value={stats.floors} label="Floors" />
                <HeroStat icon={<MapPin className="h-4 w-4" />} value={stats.zones} label="Zones" />
              </motion.div>
            )}
          </div>
        </motion.section>

        {data && <SavedZones data={data} />}

        {/* ── scene cards ───────────────────────────────────────── */}
        <section className="mt-14 grid gap-4 sm:grid-cols-3">
          <SceneCard
            no="02"
            icon={<Smartphone className="h-5 w-5" />}
            title="Instant on mobile"
            text="Opens in the browser the moment a QR code is scanned. No app installs, no accounts — and it keeps working offline."
            glow="from-blue-500/40"
            delay={0}
          />
          <SceneCard
            no="03"
            icon={<Compass className="h-5 w-5" />}
            title="Tap-to-explore zones"
            text="Every area — inventory, planning, assembly, canteen — is tappable with contacts, photos and live status."
            glow="from-amber-500/40"
            delay={0.1}
          />
          <SceneCard
            no="04"
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Safety first"
            text="PPE requirements, hazard notes and a one-tap emergency mode that lights up every exit."
            glow="from-emerald-500/40"
            delay={0.2}
          />
        </section>

        {/* ── how it works · pipeline ───────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="mt-14 overflow-hidden rounded-2xl bg-ink-950 p-6 text-white shadow-glass sm:p-8"
        >
          <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.3em] text-white/40">
            <Clapperboard className="h-3.5 w-3.5" /> HOW IT WORKS
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            {[
              ['Scan', 'A QR code at the entrance (or any zone) opens the live map at that exact spot.'],
              ['Explore', 'Pinch, zoom and tap zones for descriptions, contacts and safety notes.'],
              ['Navigate', 'Follow the animated route from where you stand to where you need to be.'],
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
        </motion.section>
      </main>

      <SiteFooter settings={data} />
    </div>
  );
}

function SceneCard({
  no,
  icon,
  title,
  text,
  glow,
  delay,
}: {
  no: string;
  icon: React.ReactNode;
  title: string;
  text: string;
  glow: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay }}
      className="group relative overflow-hidden rounded-2xl bg-ink-950 p-6 text-white shadow-glass transition-transform hover:-translate-y-1"
    >
      <div
        className={`pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br ${glow} to-transparent blur-2xl opacity-60 transition-opacity group-hover:opacity-100`}
        aria-hidden="true"
      />
      <p className="font-mono text-[10px] tracking-[0.3em] text-white/40">SCENE {no}</p>
      <div className="mt-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
        {icon}
      </div>
      <h3 className="mt-4 font-bold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-white/50">{text}</p>
    </motion.div>
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
    <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.5 }} className="mt-8">
      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
        {t.favorites} · {t.recent}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
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
