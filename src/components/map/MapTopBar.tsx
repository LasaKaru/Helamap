import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, Layers, Search, X } from 'lucide-react';
import type { MapData } from '../../types';
import { allZones, type ZoneRef } from '../../lib/data';
import { ZoneIcon } from '../../lib/icons';
import { cn } from '../../lib/utils';
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
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const building = data.buildings.find((b) => b.id === buildingId) ?? data.buildings[0];

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allZones(data)
      .filter(
        (r) =>
          r.zone.name.toLowerCase().includes(q) ||
          r.zone.shortName.toLowerCase().includes(q) ||
          r.zone.description.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [data, query]);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 no-print">
      <div className="pointer-events-auto mx-auto max-w-3xl px-3 pt-safe">
        <div className="glass mt-3 rounded-2xl p-2.5">
          {/* Row 1: brand + search + theme */}
          <div className="flex items-center gap-2">
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
                  ref={inputRef}
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '100%', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  type="search"
                  role="searchbox"
                  aria-label="Search zones"
                  placeholder="Search zones…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="input h-10 max-w-[52vw] sm:max-w-xs !rounded-xl"
                  autoFocus
                />
              )}
            </AnimatePresence>

            <button
              type="button"
              aria-label={searchOpen ? 'Close search' : 'Search zones'}
              onClick={() => {
                setSearchOpen((v) => !v);
                setQuery('');
              }}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
            >
              {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </button>
            <ThemeToggle className="shrink-0" />
          </div>

          {/* Row 2: building + floor pills */}
          <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Building2 className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
            {data.buildings.map((b) => (
              <Pill
                key={b.id}
                active={b.id === buildingId}
                onClick={() => onSelectBuilding(b.id)}
              >
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

        {/* Search results */}
        <AnimatePresence>
          {searchOpen && query.trim() && (
            <motion.ul
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="glass-strong mt-2 overflow-hidden rounded-2xl"
              role="listbox"
              aria-label="Zone search results"
            >
              {results.length === 0 && (
                <li className="px-4 py-4 text-sm text-ink-500">No zones match “{query}”.</li>
              )}
              {results.map((r) => (
                <li key={r.zone.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-ink-100/70 dark:hover:bg-ink-800/70 transition-colors"
                    onClick={() => {
                      onPickZone(r);
                      setSearchOpen(false);
                      setQuery('');
                    }}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                      style={{ backgroundColor: r.zone.color }}
                    >
                      <ZoneIcon name={r.zone.icon} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{r.zone.name}</span>
                      <span className="block truncate text-xs text-ink-500">
                        {r.building.name} · {r.floor.name}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
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
