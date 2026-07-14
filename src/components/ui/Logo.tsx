import { MapPin } from 'lucide-react';
import type { AppSettings } from '../../types';
import { assetUrl, cn } from '../../lib/utils';

/** Company logo if configured in admin settings, otherwise a branded mark. */
export default function Logo({
  settings,
  className,
  markClassName,
}: {
  settings?: Pick<AppSettings, 'logo' | 'appName' | 'primaryColor'> | null;
  className?: string;
  markClassName?: string;
}) {
  const logo = assetUrl(settings?.logo || undefined);
  if (logo) {
    return (
      <img
        src={logo}
        alt={`${settings?.appName ?? 'App'} logo`}
        className={cn('h-9 w-9 rounded-xl object-contain bg-white/10', className)}
      />
    );
  }
  return (
    <div
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-soft',
        className,
      )}
      style={{ backgroundColor: settings?.primaryColor || '#3B82F6' }}
      aria-hidden="true"
    >
      <MapPin className={cn('h-5 w-5', markClassName)} strokeWidth={2.4} />
    </div>
  );
}
