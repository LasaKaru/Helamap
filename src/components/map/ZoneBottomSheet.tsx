import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  Link2,
  Navigation,
  Star,
  StickyNote,
  TriangleAlert,
  X,
} from 'lucide-react';
import type { Zone } from '../../types';
import { ZoneIcon } from '../../lib/icons';
import { assetUrl, cn, copyToClipboard } from '../../lib/utils';
import { STATUS_COLORS, useI18n } from '../../lib/i18n';
import { getFavorites, getNote, setNote, toggleFavorite } from '../../lib/prefs';

interface ZoneBottomSheetProps {
  zone: Zone | null;
  onClose: () => void;
  /** Deep link for "Share this location" (null hides the button). */
  shareUrl?: string | null;
  /** Whether a "Get directions" action makes sense (here-zone known & different). */
  canShowDirections?: boolean;
  directionsActive?: boolean;
  onToggleDirections?: () => void;
  /** Stairs/elevator connector: jump to the linked floor. */
  connectedFloorName?: string | null;
  onGoToFloor?: () => void;
}

export default function ZoneBottomSheet({
  zone,
  onClose,
  shareUrl,
  canShowDirections,
  directionsActive,
  onToggleDirections,
  connectedFloorName,
  onGoToFloor,
}: ZoneBottomSheetProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [note, setNoteText] = useState('');
  const [showNote, setShowNote] = useState(false);

  useEffect(() => {
    setExpanded(false);
    setCopied(false);
    if (zone) {
      setIsFav(getFavorites().includes(zone.id));
      const existing = getNote(zone.id);
      setNoteText(existing);
      setShowNote(Boolean(existing));
    }
  }, [zone?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const detailLines = (zone?.details ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <AnimatePresence>
      {zone && (
        <motion.div
          key={zone.id}
          role="dialog"
          aria-label={`Details for ${zone.name}`}
          initial={{ y: '105%' }}
          animate={{ y: 0 }}
          exit={{ y: '105%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 90 || info.velocity.y > 500) onClose();
          }}
          className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-lg no-print"
        >
          <div className="glass-strong rounded-t-3xl pb-safe overflow-hidden">
            {/* Color accent + drag handle */}
            <div className="h-1.5 w-full" style={{ backgroundColor: zone.color }} />
            <div className="flex justify-center pt-2.5">
              <div className="h-1.5 w-12 rounded-full bg-ink-300 dark:bg-ink-600" />
            </div>

            <div className="max-h-[62vh] overflow-y-auto px-5 pb-6 pt-3">
              {/* Header */}
              <div className="flex items-start gap-3.5">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-soft"
                  style={{ backgroundColor: zone.color }}
                >
                  <ZoneIcon name={zone.icon} className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold leading-tight">{zone.name}</h2>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                      {zone.shortName}
                    </p>
                    {zone.status && (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                        style={{ backgroundColor: STATUS_COLORS[zone.status] }}
                      >
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                        {t.statusLabels[zone.status]}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFav(toggleFavorite(zone.id).includes(zone.id))}
                  aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  aria-pressed={isFav}
                  className="rounded-full p-2 transition-colors hover:bg-ink-100 dark:hover:bg-ink-800"
                >
                  <Star
                    className={cn(
                      'h-5 w-5 transition-colors',
                      isFav ? 'fill-amber-400 text-amber-400' : 'text-ink-400',
                    )}
                  />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close details"
                  className="rounded-full p-2 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Description */}
              <p className="mt-3.5 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                {zone.description}
              </p>

              {/* Safety notes */}
              {zone.safetyNotes && (
                <div className="mt-4 flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5">
                  <TriangleAlert className="h-5 w-5 shrink-0 text-amber-500" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                      {t.safety}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-amber-800 dark:text-amber-200">
                      {zone.safetyNotes}
                    </p>
                  </div>
                </div>
              )}

              {/* Stairs / elevator jump */}
              {connectedFloorName && onGoToFloor && (
                <button
                  type="button"
                  onClick={onGoToFloor}
                  className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3.5 text-left transition-colors hover:bg-blue-500/20"
                >
                  <ArrowUpDown className="h-5 w-5 shrink-0 text-blue-500" />
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    {t.goToFloor} {connectedFloorName}
                  </span>
                </button>
              )}

              {/* Expandable details */}
              {detailLines.length > 0 && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    aria-expanded={expanded}
                    className="flex w-full items-center justify-between rounded-xl bg-ink-100/70 dark:bg-ink-800/70 px-4 py-3 text-sm font-semibold"
                  >
                    {t.moreDetails}
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform duration-300',
                        expanded && 'rotate-180',
                      )}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        {detailLines.map((line, i) => (
                          <li
                            key={i}
                            className="flex gap-2.5 px-4 py-1.5 first:pt-3 text-sm text-ink-600 dark:text-ink-300"
                          >
                            <span
                              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: zone.color }}
                            />
                            {line.replace(/^•\s*/, '')}
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Photo */}
              {zone.photo && (
                <img
                  src={assetUrl(zone.photo)}
                  alt={zone.name}
                  loading="lazy"
                  className="mt-4 w-full rounded-2xl object-cover shadow-soft"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}

              {/* Personal note (device-local) */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowNote((v) => !v)}
                  aria-expanded={showNote}
                  className="flex items-center gap-2 text-xs font-semibold text-ink-400 hover:text-ink-600 dark:hover:text-ink-200 transition-colors"
                >
                  <StickyNote className="h-3.5 w-3.5" />
                  {t.myNotes}
                </button>
                {showNote && (
                  <textarea
                    className="input mt-2 min-h-[64px] text-sm"
                    value={note}
                    placeholder={t.notesPlaceholder}
                    onChange={(e) => {
                      setNoteText(e.target.value);
                      setNote(zone.id, e.target.value);
                    }}
                  />
                )}
              </div>

              {/* Actions */}
              <div className="mt-5 flex gap-2.5">
                {canShowDirections && onToggleDirections && (
                  <button
                    type="button"
                    onClick={onToggleDirections}
                    className={cn(
                      'btn flex-1',
                      directionsActive
                        ? 'bg-blue-600 text-white hover:bg-blue-500'
                        : 'btn-outline',
                    )}
                  >
                    <Navigation className="h-4 w-4" />
                    {directionsActive ? t.hideRoute : t.getDirections}
                  </button>
                )}
                {shareUrl && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (await copyToClipboard(shareUrl)) {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }
                    }}
                    className="btn-outline flex-1"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-500" /> {t.linkCopied}
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4" /> {t.shareLocation}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
