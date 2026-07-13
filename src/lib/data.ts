import type { Building, Floor, MapData, Zone } from '../types';
import { DATA_URL } from '../config';
import sampleData from '../../public/data/map-data.json';

/** The sample dataset bundled at build time (used by "Reset to sample data"). */
export function getSampleData(): MapData {
  return structuredClone(sampleData) as MapData;
}

/** Fetch the live static JSON that ships with the deployment. */
export async function fetchMapData(): Promise<MapData> {
  const res = await fetch(`${DATA_URL}?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load map data (HTTP ${res.status})`);
  const json = (await res.json()) as MapData;
  assertMapData(json);
  return json;
}

/** Light structural validation — enough to catch a badly hand-edited file. */
export function assertMapData(data: unknown): asserts data is MapData {
  const d = data as MapData;
  if (!d || typeof d !== 'object') throw new Error('Data is not an object');
  if (typeof d.appName !== 'string') throw new Error('Missing "appName"');
  if (!Array.isArray(d.buildings)) throw new Error('Missing "buildings" array');
  for (const b of d.buildings) {
    if (!b.id || !b.name) throw new Error('Building missing id/name');
    if (!Array.isArray(b.floors)) throw new Error(`Building "${b.name}" missing floors`);
    for (const f of b.floors) {
      if (!f.id || !f.name) throw new Error('Floor missing id/name');
      if (!Array.isArray(f.zones)) throw new Error(`Floor "${f.name}" missing zones`);
      for (const z of f.zones) {
        if (!z.id || !z.name) throw new Error('Zone missing id/name');
        if (!Array.isArray(z.polygon)) throw new Error(`Zone "${z.name}" missing polygon`);
      }
    }
  }
}

export function countStats(data: MapData) {
  const buildings = data.buildings.length;
  const floors = data.buildings.reduce((n, b) => n + b.floors.length, 0);
  const zones = data.buildings.reduce(
    (n, b) => n + b.floors.reduce((m, f) => m + f.zones.length, 0),
    0,
  );
  return { buildings, floors, zones };
}

export interface ZoneRef {
  building: Building;
  floor: Floor;
  zone: Zone;
}

/** Flatten every zone with its building/floor context (for search & QR pickers). */
export function allZones(data: MapData): ZoneRef[] {
  const out: ZoneRef[] = [];
  for (const building of data.buildings)
    for (const floor of building.floors)
      for (const zone of floor.zones) out.push({ building, floor, zone });
  return out;
}

export function findZone(data: MapData, zoneId: string): ZoneRef | undefined {
  return allZones(data).find((r) => r.zone.id === zoneId);
}
