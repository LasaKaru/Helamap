import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import type { MapData } from '../../types';

const FOOTER_LINKS: { slug: string; label: string }[] = [
  { slug: 'about', label: 'About' },
  { slug: 'contact', label: 'Contact' },
  { slug: 'privacy-policy', label: 'Privacy' },
  { slug: 'terms-of-service', label: 'Terms' },
  { slug: 'cookie-policy', label: 'Cookies' },
  { slug: 'refund-policy', label: 'Refunds' },
  { slug: 'license', label: 'License' },
];

/** Shared footer with legal page links and the (white-labelable) credit. */
export default function SiteFooter({ settings }: { settings?: MapData | null }) {
  return (
    <footer className="border-t border-ink-100 dark:border-ink-800/60 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-5 text-center text-xs text-ink-400">
        <nav aria-label="Legal pages" className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
          {FOOTER_LINKS.map((l) => (
            <Link
              key={l.slug}
              to={`/pages/${l.slug}`}
              className="font-medium hover:text-ink-600 dark:hover:text-ink-200 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        {settings?.address && <p>{settings.address}</p>}
        <p>{[settings?.contactEmail, settings?.contactPhone].filter(Boolean).join(' · ')}</p>
        <p className="font-semibold text-ink-500">
          © {new Date().getFullYear()} {settings?.companyName ?? ''}
        </p>
        {!settings?.whiteLabel && (
          <p className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            Powered by FacilityFlow
          </p>
        )}
      </div>
    </footer>
  );
}
