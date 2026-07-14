import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { WifiOff, X } from 'lucide-react';
import { useMapData } from '../hooks/useMapData';
import SplashScreen from '../components/map/SplashScreen';
import MapExperience, { type MapLocation } from '../components/map/MapExperience';
import Seo from '../components/ui/Seo';

/**
 * Public QR-scan experience.
 * Deep links: #/map?building=b1&floor=f1&zone=z-inventory&here=z-entrance
 */
export default function MapPage() {
  const { data, error, loading, backendOffline } = useMapData(900);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [offlineDismissed, setOfflineDismissed] = useState(false);

  // Capture the params from the scanned link once — the map drives them afterwards.
  const initialRef = useRef<MapLocation>();
  if (!initialRef.current) {
    initialRef.current = {
      buildingId: searchParams.get('building'),
      floorId: searchParams.get('floor'),
      // `highlight` is a friendly alias for `zone` on printed QR materials.
      zoneId: searchParams.get('zone') ?? searchParams.get('highlight'),
      hereZoneId: searchParams.get('here'),
    };
  }
  const initial = useMemo(() => initialRef.current!, []);

  const syncUrl = useCallback(
    (loc: Required<MapLocation>) => {
      const params = new URLSearchParams();
      if (loc.buildingId) params.set('building', loc.buildingId);
      if (loc.floorId) params.set('floor', loc.floorId);
      if (loc.zoneId) params.set('zone', loc.zoneId);
      if (loc.hereZoneId) params.set('here', loc.hereZoneId);
      setSearchParams(params, { replace: true });
    },
    [setSearchParams],
  );

  if (loading || !data) return <SplashScreen error={error} />;

  return (
    <div className="fixed inset-0">
      <Seo title="Facility Map" settings={data} />
      <MapExperience
        data={data}
        initial={initial}
        onLocationChange={syncUrl}
        onHome={() => navigate('/')}
      />
      {/* Backend Mode enabled but API unreachable → static fallback warning */}
      {backendOffline && !offlineDismissed && (
        <div className="absolute inset-x-0 bottom-16 z-30 flex justify-center px-4 no-print">
          <div className="glass-strong flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <WifiOff className="h-4 w-4 shrink-0" />
            Backend unreachable — showing the last published static map.
            <button
              type="button"
              aria-label="Dismiss warning"
              onClick={() => setOfflineDismissed(true)}
              className="rounded-full p-1 hover:bg-ink-100 dark:hover:bg-ink-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
