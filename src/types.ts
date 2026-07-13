/** Coordinate pair in map pixel space (relative to floor mapWidth × mapHeight). */
export type Point = [number, number];

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
