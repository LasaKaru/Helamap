import { useEffect, useState } from 'react';
import type { MapData } from '../types';
import { fetchMapData } from '../lib/data';

interface State {
  data: MapData | null;
  error: string | null;
  loading: boolean;
}

/** Load the public static map data once, with a minimum splash duration. */
export function useMapData(minSplashMs = 0): State {
  const [state, setState] = useState<State>({ data: null, error: null, loading: true });

  useEffect(() => {
    let cancelled = false;
    const started = performance.now();
    fetchMapData()
      .then(async (data) => {
        const elapsed = performance.now() - started;
        if (elapsed < minSplashMs)
          await new Promise((r) => setTimeout(r, minSplashMs - elapsed));
        if (!cancelled) setState({ data, error: null, loading: false });
      })
      .catch((e: Error) => {
        if (!cancelled) setState({ data: null, error: e.message, loading: false });
      });
    return () => {
      cancelled = true;
    };
  }, [minSplashMs]);

  return state;
}
