/** Coordinate pair in map pixel space (relative to floor mapWidth × mapHeight). */
export type Point = [number, number];

/** Live-like status set by admins in the JSON (static simulation). */
export type ZoneStatus = 'busy' | 'low-stock' | 'maintenance' | 'closed';

/** Optional per-language overrides for user-facing zone text. */
export interface ZoneTranslation {
  name?: string;
  shortName?: string;
  description?: string;
  details?: string;
  safetyNotes?: string;
}

export interface Zone {
  id: string;
  name: string;
  shortName: string;
  color: string;
  icon: string;
  description: string;
  /** Extra detail lines. Supports "• " bullets and plain newlines. */
  details?: string;
  safetyNotes?: string;
  polygon: Point[];
  center: Point;
  photo?: string;
  isHighlighted?: boolean;
  /** Marked as an emergency exit — highlighted by the public Emergency mode. */
  isExit?: boolean;
  /** Search filter tags, e.g. ["safety", "high-traffic"]. */
  tags?: string[];
  /** Status badge shown on the map label and bottom sheet. */
  status?: ZoneStatus;
  /**
   * Stairs/elevator connector: tapping this zone offers a one-tap jump to the
   * linked floor in the same building (e.g. a stairwell present on both floors).
   */
  connectsToFloorId?: string;
  /** Translations keyed by language code (currently "si" for Sinhala). */
  translations?: Record<string, ZoneTranslation>;
}

export interface Floor {
  id: string;
  name: string;
  level: number;
  /** Path under /public (e.g. "/maps/main-ground.svg") or a data: URL. */
  mapImage: string;
  mapWidth: number;
  mapHeight: number;
  zones: Zone[];
}

export interface Building {
  id: string;
  name: string;
  description: string;
  floors: Floor[];
}

/** Branding & company info — fully editable from the admin Settings tab. */
export interface AppSettings {
  appName: string;
  companyName: string;
  tagline?: string;
  /** Path under /public or a base64 data: URL uploaded in admin. */
  logo?: string;
  primaryColor?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  website?: string;
  welcomeMessage?: string;
}

export interface MapData extends AppSettings {
  version: string;
  lastUpdated: string;
  buildings: Building[];
}
