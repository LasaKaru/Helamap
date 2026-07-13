import { useCallback, useEffect, useRef, useState } from 'react';
import type { MapData } from '../types';
import { DRAFT_STORAGE_KEY } from '../config';
import { assertMapData, fetchMapData, getSampleData } from '../lib/data';
import { downloadJson } from '../lib/utils';

const LAST_EXPORT_KEY = 'helamap-last-export';

export type DraftUpdater = MapData | ((prev: MapData) => MapData);

export interface AdminDraft {
  data: MapData | null;
  loading: boolean;
  /** True when the draft differs from what was last loaded/exported. */
  dirty: boolean;
  lastExport: string | null;
  update: (updater: DraftUpdater) => void;
  exportData: () => MapData;
  importData: (json: unknown) => void;
  resetToSample: () => void;
  /** Throw away the local draft and reload the live map-data.json. */
  discardDraft: () => Promise<void>;
}

/**
 * All admin edits live in React state, auto-saved to localStorage as a draft.
 * Nothing touches the server — "Save & Export" downloads a fresh
 * map-data.json that the admin drops into /public/data/ on their host.
 */
export function useAdminDraft(): AdminDraft {
  const [data, setData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [lastExport, setLastExport] = useState<string | null>(() =>
    localStorage.getItem(LAST_EXPORT_KEY),
  );
  const saveTimer = useRef<number>();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Prefer an in-progress draft; fall back to the live file, then the sample.
      try {
        const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (raw) {
          const draft = JSON.parse(raw) as unknown;
          assertMapData(draft);
          if (!cancelled) {
            setData(draft);
            setDirty(true);
            setLoading(false);
          }
          return;
        }
      } catch {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
      try {
        const live = await fetchMapData();
        if (!cancelled) setData(live);
      } catch {
        if (!cancelled) setData(getSampleData());
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: MapData) => {
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Quota exceeded (huge base64 images) — draft stays in memory only.
      }
    }, 400);
  }, []);

  const update = useCallback(
    (updater: DraftUpdater) => {
      setData((prev) => {
        if (!prev) return prev;
        const next = typeof updater === 'function' ? updater(prev) : updater;
        persist(next);
        setDirty(true);
        return next;
      });
    },
    [persist],
  );

  const exportData = useCallback((): MapData => {
    if (!data) throw new Error('No data to export');
    const out: MapData = { ...data, lastUpdated: new Date().toISOString() };
    downloadJson(out, 'map-data.json');
    const now = new Date().toISOString();
    localStorage.setItem(LAST_EXPORT_KEY, now);
    setLastExport(now);
    setData(out);
    persist(out);
    return out;
  }, [data, persist]);

  const importData = useCallback(
    (json: unknown) => {
      assertMapData(json);
      setData(json);
      setDirty(true);
      persist(json);
    },
    [persist],
  );

  const resetToSample = useCallback(() => {
    const sample = getSampleData();
    setData(sample);
    setDirty(true);
    persist(sample);
  }, [persist]);

  const discardDraft = useCallback(async () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setLoading(true);
    try {
      const live = await fetchMapData();
      setData(live);
    } catch {
      setData(getSampleData());
    }
    setDirty(false);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    dirty,
    lastExport,
    update,
    exportData,
    importData,
    resetToSample,
    discardDraft,
  };
}
