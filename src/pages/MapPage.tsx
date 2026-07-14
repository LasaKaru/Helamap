import { useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMapData } from '../hooks/useMapData';
import SplashScreen from '../components/map/SplashScreen';
import MapExperience, { type MapLocation } from '../components/map/MapExperience';

/**
 * Public QR-scan experience.
 * Deep links: #/map?building=b1&floor=f1&zone=z-inventory&here=z-entrance
 */
export default function MapPage() {
  const { data, error, loading } = useMapData(900);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

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
      <MapExperience
        data={data}
        initial={initial}
        onLocationChange={syncUrl}
        onHome={() => navigate('/')}
      />
    </div>
  );
}
