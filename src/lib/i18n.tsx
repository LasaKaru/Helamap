import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Zone, ZoneStatus } from '../types';

export type Lang = 'en' | 'si';
const LANG_KEY = 'helamap-lang';

export interface Dict {
  loading: string;
  searchZones: string;
  noMatches: string;
  youAreHere: string;
  getDirections: string;
  hideRoute: string;
  shareLocation: string;
  linkCopied: string;
  moreDetails: string;
  safety: string;
  updated: string;
  emergency: string;
  emergencyOn: string;
  exit: string;
  favorites: string;
  recent: string;
  myNotes: string;
  notesPlaceholder: string;
  goToFloor: string;
  statusLabels: Record<ZoneStatus, string>;
}

/** UI chrome strings for the public map. Admin panel stays English. */
const DICT: Record<Lang, Dict> = {
  en: {
    loading: 'Loading facility map…',
    searchZones: 'Search zones…',
    noMatches: 'No zones match',
    youAreHere: 'You are here',
    getDirections: 'Get directions',
    hideRoute: 'Hide route',
    shareLocation: 'Share location',
    linkCopied: 'Link copied',
    moreDetails: 'More details',
    safety: 'Safety',
    updated: 'Updated',
    emergency: 'Emergency',
    emergencyOn: 'Emergency mode — exits highlighted',
    exit: 'EXIT',
    favorites: 'Favorites',
    recent: 'Recently viewed',
    myNotes: 'My notes (only on this device)',
    notesPlaceholder: 'e.g. locker 214, ask for Nuwan…',
    goToFloor: 'Take stairs / lift to',
    statusLabels: {
      busy: 'Busy',
      'low-stock': 'Low stock',
      maintenance: 'Maintenance',
      closed: 'Closed',
    } as Record<ZoneStatus, string>,
  },
  si: {
    loading: 'පහසුකම් සිතියම පූරණය වෙමින්…',
    searchZones: 'කලාප සොයන්න…',
    noMatches: 'ගැළපෙන කලාප නැත',
    youAreHere: 'ඔබ මෙතැන සිටී',
    getDirections: 'මාර්ගය පෙන්වන්න',
    hideRoute: 'මාර්ගය සඟවන්න',
    shareLocation: 'ස්ථානය බෙදාගන්න',
    linkCopied: 'සබැඳිය පිටපත් විය',
    moreDetails: 'වැඩි විස්තර',
    safety: 'ආරක්ෂාව',
    updated: 'යාවත්කාලීන',
    emergency: 'හදිසි',
    emergencyOn: 'හදිසි ප්‍රකාරය — පිටවීම් ඉස්මතු කර ඇත',
    exit: 'පිටවීම',
    favorites: 'ප්‍රියතම',
    recent: 'මෑතදී බැලූ',
    myNotes: 'මගේ සටහන් (මෙම උපාංගයේ පමණි)',
    notesPlaceholder: 'උදා: ලොකර් 214…',
    goToFloor: 'පඩිපෙළ / සෝපානය —',
    statusLabels: {
      busy: 'කාර්යබහුලයි',
      'low-stock': 'තොග අඩුයි',
      maintenance: 'නඩත්තු',
      closed: 'වසා ඇත',
    } as Record<ZoneStatus, string>,
  },
};

interface I18nValue {
  lang: Lang;
  t: Dict;
  toggleLang: () => void;
}

const I18nContext = createContext<I18nValue>({
  lang: 'en',
  t: DICT.en,
  toggleLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      return localStorage.getItem(LANG_KEY) === 'si' ? 'si' : 'en';
    } catch {
      return 'en';
    }
  });

  const toggleLang = useCallback(() => {
    setLang((l) => {
      const next: Lang = l === 'en' ? 'si' : 'en';
      try {
        localStorage.setItem(LANG_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo<I18nValue>(
    () => ({ lang, t: DICT[lang], toggleLang }),
    [lang, toggleLang],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}

/** Merge a zone's translations for the active language over its base fields. */
export function localizeZone(zone: Zone, lang: Lang): Zone {
  if (lang === 'en') return zone;
  const tr = zone.translations?.[lang];
  if (!tr) return zone;
  return {
    ...zone,
    name: tr.name ?? zone.name,
    shortName: tr.shortName ?? zone.shortName,
    description: tr.description ?? zone.description,
    details: tr.details ?? zone.details,
    safetyNotes: tr.safetyNotes ?? zone.safetyNotes,
  };
}

export const STATUS_COLORS: Record<ZoneStatus, string> = {
  busy: '#EF4444',
  'low-stock': '#F59E0B',
  maintenance: '#8B5CF6',
  closed: '#64748B',
};
