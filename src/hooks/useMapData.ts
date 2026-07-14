import { useEffect, useState } from 'react';
import type { MapData } from '../types';
import { assertMapData, fetchMapData } from '../lib/data';
import { api, backendEnabled } from '../lib/api';

interface State {
  data: MapData | null;
  error: string | null;
  loading: boolean;
  /** True when Backend Mode is on but the API was unreachable (static fallback). */
  backendOffline: boolean;
}

/**
 * Load the public map data once, with a minimum splash duration.
 * Dual Mode: when Backend Mode is enabled the REST API is the source of
 * truth; if it is unreachable we gracefully fall back to the static JSON
 * and expose `backendOffline` so the UI can show a warning.
 */
export function useMapData(minSplashMs = 0): State {
  const [state, setState] = useState<State>({
    data: null,
    error: null,
    loading: true,
    backendOffline: false,
  });

  useEffect(() => {
    let cancelled = false;
    const started = performance.now();

    (async () => {
      let data: MapData | null = null;
      let error: string | null = null;
      let backendOffline = false;

      if (backendEnabled()) {
        try {
          const fromApi = await api.getMap();
          assertMapData(fromApi);
          data = fromApi;
        } catch {
          backendOffline = true;
        }
      }
      if (!data) {
        try {
          data = await fetchMapData();
        } catch (e) {
          error = (e as Error).message;
        }
      }

      const elapsed = performance.now() - started;
      if (elapsed < minSplashMs) await new Promise((r) => setTimeout(r, minSplashMs - elapsed));
      if (!cancelled) setState({ data, error, loading: false, backendOffline });
    })();

    return () => {
      cancelled = true;
    };
  }, [minSplashMs]);

  return state;
}
