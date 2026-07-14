import { useCallback, useEffect, useRef, useState } from 'react';
import type { MapData } from '../types';
import { DRAFT_STORAGE_KEY } from '../config';
import { assertMapData, fetchMapData, getSampleData } from '../lib/data';
import { api, backendEnabled } from '../lib/api';
import { downloadJson } from '../lib/utils';

const LAST_EXPORT_KEY = 'helamap-last-export';
const HISTORY_KEY = 'helamap-export-history';
const HISTORY_LIMIT = 5;

export interface ExportVersion {
  ts: string;
  data: MapData;
}

function readHistory(): ExportVersion[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') as ExportVersion[];
  } catch {
    return [];
  }
}

export type DraftUpdater = MapData | ((prev: MapData) => MapData);

export interface AdminDraft {
  data: MapData | null;
  loading: boolean;
  /** True when the draft differs from what was last loaded/exported. */
  dirty: boolean;
  lastExport: string | null;
  /** Previous exports kept in this browser (newest first). */
  history: ExportVersion[];
  /** True when Backend Mode is enabled in settings. */
  backendMode: boolean;
  update: (updater: DraftUpdater) => void;
  exportData: () => MapData;
  importData: (json: unknown) => void;
  resetToSample: () => void;
  /** Load a previous export back into the draft. */
  restoreVersion: (version: ExportVersion) => void;
  /** Backend Mode: PUT the draft to the API so it goes live immediately. */
  publish: () => Promise<void>;
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
  const [history, setHistory] = useState<ExportVersion[]>(readHistory);
  const saveTimer = useRef<number>();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Prefer an in-progress draft; fall back to the live source, then sample.
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
      // Live source: API in Backend Mode, static JSON otherwise.
      if (backendEnabled()) {
        try {
          const fromApi = await api.getMap();
          assertMapData(fromApi);
          if (!cancelled) {
            setData(fromApi);
            setLoading(false);
          }
          return;
        } catch {
          /* fall through to the static file */
        }
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
    const now = new Date().toISOString();
    const out: MapData = { ...data, lastUpdated: now };
    downloadJson(out, 'map-data.json');
    localStorage.setItem(LAST_EXPORT_KEY, now);
    setLastExport(now);
    setData(out);
    persist(out);
    // Keep a rolling version history in this browser (skip if the payload is
    // huge, e.g. many embedded base64 images, to protect the storage quota).
    const serialized = JSON.stringify(out);
    if (serialized.length < 900_000) {
      const next = [{ ts: now, data: out }, ...readHistory()].slice(0, HISTORY_LIMIT);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        setHistory(next);
      } catch {
        /* quota — history is a convenience, not a requirement */
      }
    }
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

  const restoreVersion = useCallback(
    (version: ExportVersion) => {
      setData(version.data);
      setDirty(true);
      persist(version.data);
    },
    [persist],
  );

  const publish = useCallback(async () => {
    if (!data) throw new Error('No data to publish');
    await api.saveMap(data);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setDirty(false);
  }, [data]);

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
    history,
    backendMode: backendEnabled(),
    update,
    exportData,
    importData,
    resetToSample,
    restoreVersion,
    publish,
    discardDraft,
  };
}
