import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, Clock, Layers, Search, Star, X } from 'lucide-react';
import type { MapData } from '../../types';
import { allZones, type ZoneRef } from '../../lib/data';
import { ZoneIcon } from '../../lib/icons';
import { cn } from '../../lib/utils';
import { localizeZone, useI18n } from '../../lib/i18n';
import { getFavorites, getRecents } from '../../lib/prefs';
import Logo from '../ui/Logo';
import ThemeToggle from '../ui/ThemeToggle';

interface MapTopBarProps {
  data: MapData;
  buildingId: string;
  floorId: string;
  onSelectBuilding: (id: string) => void;
  onSelectFloor: (id: string) => void;
  onPickZone: (ref: ZoneRef) => void;
  onHome?: () => void;
}

export default function MapTopBar({
  data,
  buildingId,
  floorId,
  onSelectBuilding,
  onSelectFloor,
  onPickZone,
  onHome,
}: MapTopBarProps) {
  const { lang, t, toggleLang } = useI18n();
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const building = data.buildings.find((b) => b.id === buildingId) ?? data.buildings[0];

  const zoneRefs = useMemo(() => allZones(data), [data]);

  const allTags = useMemo(() => {
    // Most-used tags first, so the visible chips are the most useful filters.
    const counts = new Map<string, number>();
    for (const r of zoneRefs)
      for (const tag of r.zone.tags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 12)
      .map(([tag]) => tag);
  }, [zoneRefs]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q && !activeTag) return [];
    return zoneRefs
      .filter((r) => {
        const z = localizeZone(r.zone, lang);
        const matchesTag = !activeTag || (r.zone.tags ?? []).includes(activeTag);
        const matchesText =
          !q ||
          z.name.toLowerCase().includes(q) ||
          z.shortName.toLowerCase().includes(q) ||
          z.description.toLowerCase().includes(q) ||
          r.zone.name.toLowerCase().includes(q) ||
          r.zone.shortName.toLowerCase().includes(q);
        return matchesTag && matchesText;
      })
      .slice(0, 8);
  }, [zoneRefs, query, activeTag, lang]);

  // Favorites & recents shown when the search panel is open but empty.
  const saved = useMemo(() => {
    if (query.trim() || activeTag) return { favs: [], recents: [] };
    const byId = new Map(zoneRefs.map((r) => [r.zone.id, r]));
    const favs = getFavorites()
      .map((id) => byId.get(id))
      .filter((r): r is ZoneRef => Boolean(r))
      .slice(0, 5);
    const favIds = new Set(favs.map((r) => r.zone.id));
    const recents = getRecents()
      .map((id) => byId.get(id))
      .filter((r): r is ZoneRef => Boolean(r) && !favIds.has(r!.zone.id))
      .slice(0, 5);
    return { favs, recents };
  }, [zoneRefs, query, activeTag, searchOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (ref: ZoneRef) => {
    onPickZone(ref);
    setSearchOpen(false);
    setQuery('');
    setActiveTag(null);
  };

  const showPanel =
    searchOpen &&
    (query.trim() !== '' ||
      activeTag !== null ||
      allTags.length > 0 ||
      saved.favs.length > 0 ||
      saved.recents.length > 0);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 no-print">
      <div className="pointer-events-auto mx-auto max-w-3xl px-3 pt-safe">
        <div className="glass mt-3 rounded-2xl p-2.5">
          {/* Row 1: brand + search + language + theme */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onHome}
              className="flex min-w-0 items-center gap-2.5 rounded-xl px-1.5 py-1 hover:bg-ink-100/60 dark:hover:bg-ink-800/60 transition-colors"
              aria-label="Back to home"
            >
              <Logo settings={data} className="h-8 w-8" />
              <div className="min-w-0 text-left">
                <p className="truncate text-sm font-bold leading-tight">{data.appName}</p>
                <p className="truncate text-[11px] text-ink-500 dark:text-ink-400 leading-tight">
                  {data.companyName}
                </p>
              </div>
            </button>

            <div className="flex-1" />

            <AnimatePresence initial={false}>
              {searchOpen && (
                <motion.input
                  key="search"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '100%', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  type="search"
                  role="searchbox"
                  aria-label={t.searchZones}
                  placeholder={t.searchZones}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="input h-10 max-w-[46vw] sm:max-w-xs !rounded-xl"
                  autoFocus
                />
              )}
            </AnimatePresence>

            <button
              type="button"
              aria-label={searchOpen ? 'Close search' : t.searchZones}
              onClick={() => {
                setSearchOpen((v) => !v);
                setQuery('');
                setActiveTag(null);
              }}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
            >
              {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={toggleLang}
              aria-label="Switch language"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl px-2 text-xs font-bold text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
            >
              {lang === 'en' ? 'සිං' : 'EN'}
            </button>
            <ThemeToggle className="shrink-0" />
          </div>

          {/* Row 2: building + floor pills */}
          <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Building2 className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
            {data.buildings.map((b) => (
              <Pill key={b.id} active={b.id === buildingId} onClick={() => onSelectBuilding(b.id)}>
                {b.name}
              </Pill>
            ))}
            <span className="mx-1 h-5 w-px shrink-0 bg-ink-200 dark:bg-ink-700" />
            <Layers className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
            {building?.floors
              .slice()
              .sort((a, b) => a.level - b.level)
              .map((f) => (
                <Pill key={f.id} active={f.id === floorId} onClick={() => onSelectFloor(f.id)}>
                  {f.name}
                </Pill>
              ))}
          </div>
        </div>

        {/* Search panel: tag filters + favorites/recents + results */}
        <AnimatePresence>
          {showPanel && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="glass-strong mt-2 overflow-hidden rounded-2xl"
            >
              {allTags.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto px-3 pt-3 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setActiveTag((cur) => (cur === tag ? null : tag))}
                      aria-pressed={activeTag === tag}
                      className={cn(
                        'shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors',
                        activeTag === tag
                          ? 'bg-blue-600 text-white'
                          : 'bg-ink-100/80 text-ink-500 dark:bg-ink-800/80 dark:text-ink-300 hover:bg-ink-200/80 dark:hover:bg-ink-700/80',
                      )}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}

              {query.trim() || activeTag ? (
                <ul role="listbox" aria-label="Zone search results" className="pb-1">
                  {results.length === 0 && (
                    <li className="px-4 py-4 text-sm text-ink-500">
                      {t.noMatches} “{query || `#${activeTag}`}”.
                    </li>
                  )}
                  {results.map((r) => (
                    <ResultRow key={r.zone.id} r={r} lang={lang} onPick={pick} />
                  ))}
                </ul>
              ) : (
                <div className="pb-2">
                  {saved.favs.length > 0 && (
                    <>
                      <p className="flex items-center gap-1.5 px-4 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-ink-400">
                        <Star className="h-3 w-3" /> {t.favorites}
                      </p>
                      <ul>
                        {saved.favs.map((r) => (
                          <ResultRow key={r.zone.id} r={r} lang={lang} onPick={pick} />
                        ))}
                      </ul>
                    </>
                  )}
                  {saved.recents.length > 0 && (
                    <>
                      <p className="flex items-center gap-1.5 px-4 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-ink-400">
                        <Clock className="h-3 w-3" /> {t.recent}
                      </p>
                      <ul>
                        {saved.recents.map((r) => (
                          <ResultRow key={r.zone.id} r={r} lang={lang} onPick={pick} />
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ResultRow({
  r,
  lang,
  onPick,
}: {
  r: ZoneRef;
  lang: 'en' | 'si';
  onPick: (ref: ZoneRef) => void;
}) {
  const z = localizeZone(r.zone, lang);
  return (
    <li>
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-ink-100/70 dark:hover:bg-ink-800/70 transition-colors"
        onClick={() => onPick(r)}
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
          style={{ backgroundColor: z.color }}
        >
          <ZoneIcon name={z.icon} className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{z.name}</span>
          <span className="block truncate text-xs text-ink-500">
            {r.building.name} · {r.floor.name}
          </span>
        </span>
      </button>
    </li>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200',
        active
          ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900 shadow-soft'
          : 'bg-ink-100/80 text-ink-600 hover:bg-ink-200/80 dark:bg-ink-800/80 dark:text-ink-300 dark:hover:bg-ink-700/80',
      )}
    >
      {children}
    </button>
  );
}
