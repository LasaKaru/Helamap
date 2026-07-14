import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Siren } from 'lucide-react';
import type { MapData } from '../../types';
import { findZone, type ZoneRef } from '../../lib/data';
import { formatDate } from '../../lib/utils';
import { localizeZone, useI18n } from '../../lib/i18n';
import { bumpViewCount, pushRecent } from '../../lib/prefs';
import { api, backendEnabled } from '../../lib/api';
import MapViewer from './MapViewer';
import MapTopBar from './MapTopBar';
import ZoneBottomSheet from './ZoneBottomSheet';

export interface MapLocation {
  buildingId?: string | null;
  floorId?: string | null;
  zoneId?: string | null;
  hereZoneId?: string | null;
}

interface MapExperienceProps {
  data: MapData;
  initial?: MapLocation;
  /** Called whenever the visible location changes (used for URL sync). */
  onLocationChange?: (loc: Required<MapLocation>) => void;
  onHome?: () => void;
  /** Compact mode inside the admin live preview. */
  embedded?: boolean;
}

/** Builds a shareable deep link to the map with clean URLs. */
export function buildDeepLink(loc: MapLocation): string {
  const params = new URLSearchParams();
  if (loc.buildingId) params.set('building', loc.buildingId);
  if (loc.floorId) params.set('floor', loc.floorId);
  if (loc.zoneId) params.set('zone', loc.zoneId);
  if (loc.hereZoneId) params.set('here', loc.hereZoneId);
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${window.location.origin}${base}/map?${params.toString()}`;
}

export default function MapExperience({
  data,
  initial,
  onLocationChange,
  onHome,
  embedded,
}: MapExperienceProps) {
  const firstBuilding = data.buildings[0];

  const resolveInitial = useCallback((): {
    buildingId: string;
    floorId: string;
    zoneId: string | null;
  } => {
    // A zone deep link wins: it pins building + floor too.
    const zoneRef = initial?.zoneId ? findZone(data, initial.zoneId) : undefined;
    if (zoneRef)
      return {
        buildingId: zoneRef.building.id,
        floorId: zoneRef.floor.id,
        zoneId: zoneRef.zone.id,
      };
    const building =
      data.buildings.find((b) => b.id === initial?.buildingId) ?? firstBuilding;
    const floor =
      building?.floors.find((f) => f.id === initial?.floorId) ?? building?.floors[0];
    return { buildingId: building?.id ?? '', floorId: floor?.id ?? '', zoneId: null };
  }, [data, initial, firstBuilding]);

  const [{ buildingId, floorId, zoneId }, setLoc] = useState(resolveInitial);
  const [showDirections, setShowDirections] = useState(false);
  const [emergency, setEmergency] = useState(false);
  const { lang, t } = useI18n();

  const hereZoneId = initial?.hereZoneId ?? null;

  const building = data.buildings.find((b) => b.id === buildingId) ?? firstBuilding;
  const rawFloor = building?.floors.find((f) => f.id === floorId) ?? building?.floors[0];
  // Localize zone text for the active language before anything renders it.
  const floor = useMemo(
    () =>
      rawFloor
        ? { ...rawFloor, zones: rawFloor.zones.map((z) => localizeZone(z, lang)) }
        : rawFloor,
    [rawFloor, lang],
  );
  const zone = zoneId ? floor?.zones.find((z) => z.id === zoneId) ?? null : null;
  const hereRef = hereZoneId ? findZone(data, hereZoneId) : undefined;
  const hereOnThisFloor = hereRef?.floor.id === floor?.id ? hereRef.zone.id : null;

  const connectedFloor = zone?.connectsToFloorId
    ? building?.floors.find((f) => f.id === zone.connectsToFloorId) ?? null
    : null;

  useEffect(() => {
    onLocationChange?.({
      buildingId,
      floorId: floor?.id ?? null,
      zoneId,
      hereZoneId,
    });
  }, [buildingId, floor?.id, zoneId, hereZoneId, onLocationChange]);

  const selectBuilding = (id: string) => {
    const b = data.buildings.find((x) => x.id === id);
    setLoc({ buildingId: id, floorId: b?.floors[0]?.id ?? '', zoneId: null });
    setShowDirections(false);
  };
  const selectFloor = (id: string) => {
    setLoc((s) => ({ ...s, floorId: id, zoneId: null }));
    setShowDirections(false);
  };
  const selectZone = (id: string | null) => {
    setLoc((s) => ({ ...s, zoneId: id }));
    if (!id) setShowDirections(false);
    else {
      pushRecent(id);
      bumpViewCount(id);
      // Backend Mode: also feed the server-side analytics dashboard.
      if (backendEnabled()) api.trackView(id);
    }
  };
  const pickSearchResult = (ref: ZoneRef) => {
    setLoc({ buildingId: ref.building.id, floorId: ref.floor.id, zoneId: ref.zone.id });
    setShowDirections(false);
  };

  const shareUrl = useMemo(
    () => (zone ? buildDeepLink({ buildingId, floorId, zoneId: zone.id }) : null),
    [zone, buildingId, floorId],
  );

  if (!building || !floor) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-ink-500">
        No buildings configured yet. Add one from the admin panel.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-ink-100 dark:bg-ink-950">
      <MapTopBar
        data={data}
        buildingId={building.id}
        floorId={floor.id}
        onSelectBuilding={selectBuilding}
        onSelectFloor={selectFloor}
        onPickZone={pickSearchResult}
        onHome={onHome}
      />

      <MapViewer
        floor={floor}
        selectedZoneId={zone?.id ?? null}
        onSelectZone={selectZone}
        hereZoneId={hereOnThisFloor}
        showDirections={showDirections}
        emergencyMode={emergency}
      />

      {/* Emergency mode banner */}
      <AnimatePresence>
        {emergency && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="pointer-events-none absolute inset-x-0 top-32 z-20 flex justify-center px-4 no-print"
          >
            <span className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-glass">
              {t.emergencyOn}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emergency toggle + last updated badge */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 no-print">
        <button
          type="button"
          onClick={() => {
            setEmergency((v) => !v);
            selectZone(null);
          }}
          aria-pressed={emergency}
          aria-label={t.emergency}
          className={`flex h-11 w-11 items-center justify-center rounded-full shadow-glass transition-all active:scale-90 ${
            emergency
              ? 'bg-red-600 text-white'
              : 'glass text-red-500'
          }`}
        >
          <Siren className="h-5 w-5" />
        </button>
        {!embedded && (
          <span className="glass pointer-events-none rounded-full px-3 py-1.5 text-[11px] font-medium text-ink-500 dark:text-ink-400">
            {t.updated} {formatDate(data.lastUpdated)}
          </span>
        )}
      </div>

      <ZoneBottomSheet
        zone={zone ?? null}
        onClose={() => selectZone(null)}
        shareUrl={embedded ? null : shareUrl}
        canShowDirections={Boolean(hereOnThisFloor && zone && hereOnThisFloor !== zone.id)}
        directionsActive={showDirections}
        onToggleDirections={() => setShowDirections((v) => !v)}
        connectedFloorName={connectedFloor?.name ?? null}
        onGoToFloor={connectedFloor ? () => selectFloor(connectedFloor.id) : undefined}
      />
    </div>
  );
}
