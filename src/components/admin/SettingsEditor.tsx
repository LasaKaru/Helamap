import { useRef } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import type { AdminDraft } from '../../hooks/useAdminDraft';
import type { AppSettings } from '../../types';
import { fileToDataUrl } from '../../lib/utils';
import Logo from '../ui/Logo';

const PRESET_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#64748B'];

/** Company identity & branding — everything ends up in map-data.json. */
export default function SettingsEditor({ draft }: { draft: AdminDraft }) {
  const data = draft.data!;
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    draft.update((prev) => ({ ...prev, [key]: value }));

  const uploadLogo = async (file: File) => {
    if (file.size > 400 * 1024) {
      alert(
        'That image is larger than 400 KB. For a lean map-data.json, place the file in /public/logos/ instead and enter its path (e.g. /logos/company.png) — or pick a smaller image.',
      );
      return;
    }
    set('logo', await fileToDataUrl(file));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {/* Identity */}
        <section className="card p-5">
          <h2 className="font-bold">Company identity</h2>
          <p className="mt-1 text-xs text-ink-500">
            Shown on the public map header, landing page and QR posters.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="App name" id="s-app">
              <input id="s-app" className="input" value={data.appName}
                onChange={(e) => set('appName', e.target.value)} placeholder="HelaMap" />
            </Field>
            <Field label="Company name" id="s-company">
              <input id="s-company" className="input" value={data.companyName}
                onChange={(e) => set('companyName', e.target.value)} placeholder="Your Company (Pvt) Ltd" />
            </Field>
            <Field label="Tagline" id="s-tagline" full>
              <input id="s-tagline" className="input" value={data.tagline ?? ''}
                onChange={(e) => set('tagline', e.target.value)} placeholder="Find your way from day one" />
            </Field>
            <Field label="Welcome message (landing page)" id="s-welcome" full>
              <textarea id="s-welcome" className="input min-h-[84px]" value={data.welcomeMessage ?? ''}
                onChange={(e) => set('welcomeMessage', e.target.value)} />
            </Field>
          </div>
        </section>

        {/* Logo & color */}
        <section className="card p-5">
          <h2 className="font-bold">Logo & brand color</h2>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Logo settings={data} className="h-16 w-16 rounded-2xl" markClassName="h-8 w-8" />
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-outline" onClick={() => fileRef.current?.click()}>
                <ImagePlus className="h-4 w-4" /> Upload logo
              </button>
              {data.logo && (
                <button type="button" className="btn-danger" onClick={() => set('logo', '')}>
                  <Trash2 className="h-4 w-4" /> Remove
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
            </div>
          </div>
          <Field label="…or logo path on the server" id="s-logopath" className="mt-4">
            <input id="s-logopath" className="input font-mono text-xs"
              value={data.logo?.startsWith('data:') ? '(uploaded image — stored inside the JSON)' : data.logo ?? ''}
              disabled={data.logo?.startsWith('data:')}
              onChange={(e) => set('logo', e.target.value)}
              placeholder="/logos/company.png" />
          </Field>
          <div className="mt-4">
            <span className="label">Primary color</span>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button key={c} type="button" aria-label={`Set primary color ${c}`}
                  onClick={() => set('primaryColor', c)}
                  className="h-8 w-8 rounded-lg border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: data.primaryColor === c ? 'white' : 'transparent',
                    boxShadow: data.primaryColor === c ? `0 0 0 2px ${c}` : undefined,
                  }} />
              ))}
              <input type="color" aria-label="Custom primary color"
                value={data.primaryColor ?? '#3B82F6'}
                onChange={(e) => set('primaryColor', e.target.value)}
                className="h-8 w-10 cursor-pointer rounded-lg border border-ink-200 dark:border-ink-700 bg-transparent" />
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="card p-5">
          <h2 className="font-bold">Contact & location</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Contact email" id="s-email">
              <input id="s-email" type="email" className="input" value={data.contactEmail ?? ''}
                onChange={(e) => set('contactEmail', e.target.value)} placeholder="facilities@company.com" />
            </Field>
            <Field label="Contact phone" id="s-phone">
              <input id="s-phone" className="input" value={data.contactPhone ?? ''}
                onChange={(e) => set('contactPhone', e.target.value)} placeholder="+94 11 234 5678" />
            </Field>
            <Field label="Address" id="s-address" full>
              <input id="s-address" className="input" value={data.address ?? ''}
                onChange={(e) => set('address', e.target.value)} placeholder="Industrial Zone 4, Biyagama" />
            </Field>
            <Field label="Website" id="s-web" full>
              <input id="s-web" className="input" value={data.website ?? ''}
                onChange={(e) => set('website', e.target.value)} placeholder="https://company.com" />
            </Field>
          </div>
        </section>
      </div>

      {/* Live header preview */}
      <aside className="space-y-3 lg:sticky lg:top-32 self-start">
        <p className="label !mb-0">Preview</p>
        <div className="glass rounded-2xl p-3">
          <div className="flex items-center gap-2.5">
            <Logo settings={data} className="h-8 w-8" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight">{data.appName || 'App name'}</p>
              <p className="truncate text-[11px] text-ink-500 leading-tight">{data.companyName || 'Company name'}</p>
            </div>
          </div>
        </div>
        <div className="card p-4 text-xs text-ink-500 leading-relaxed">
          Everything on this page is stored in <code className="rounded bg-ink-100 dark:bg-ink-800 px-1 py-0.5">map-data.json</code>,
          so branding survives redeploys and can be edited without touching code —
          ready for the future recruitment-site version too.
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  id,
  children,
  full,
  className,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
  full?: boolean;
  className?: string;
}) {
  return (
    <div className={`${full ? 'sm:col-span-2' : ''} ${className ?? ''}`}>
      <label className="label" htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}
