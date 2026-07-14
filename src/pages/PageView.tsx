import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Send } from 'lucide-react';
import { useMapData } from '../hooks/useMapData';
import { api, backendEnabled } from '../lib/api';
import { DEFAULT_PAGES } from '../lib/defaultPages';
import type { PageContent } from '../types';
import Seo from '../components/ui/Seo';
import ThemeToggle from '../components/ui/ThemeToggle';
import SiteFooter from '../components/ui/SiteFooter';

/**
 * Public legal/company page (/pages/privacy-policy, /pages/about, …).
 * Content priority: Backend API → map-data.json `pages` → bundled defaults,
 * with company placeholders filled from branding settings.
 */
export default function PageView() {
  const { slug = '' } = useParams();
  const { data } = useMapData();
  const [page, setPage] = useState<PageContent | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPage(null);
      setNotFound(false);
      if (backendEnabled()) {
        try {
          const res = await api.getPage(slug);
          if (!cancelled) setPage({ slug, title: res.page.title, html: res.page.html });
          return;
        } catch {
          /* fall through to static sources */
        }
      }
      const fromData = data?.pages?.find((p) => p.slug === slug);
      const fallback = DEFAULT_PAGES.find((p) => p.slug === slug);
      if (fromData || fallback) {
        if (!cancelled) setPage(fromData ?? fallback!);
      } else if (data) {
        if (!cancelled) setNotFound(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, data]);

  // Fill professional placeholders from the live branding settings.
  const html = (page?.html ?? '')
    .replaceAll('[COMPANY NAME]', data?.companyName ?? 'our company')
    .replaceAll('[CONTACT EMAIL]', data?.contactEmail ?? 'facilities@example.com')
    .replaceAll('[PHONE NUMBER]', data?.contactPhone ?? '')
    .replaceAll('[COMPANY ADDRESS]', data?.address ?? '');

  return (
    <div className="ambient-grid flex min-h-screen flex-col">
      <Seo title={page?.title ?? 'Page'} settings={data} />
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-5">
        <Link to="/" className="btn-ghost !px-3">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16">
        {notFound ? (
          <div className="card p-10 text-center">
            <h1 className="text-xl font-bold">Page not found</h1>
            <p className="mt-2 text-sm text-ink-500">This page hasn't been created yet.</p>
          </div>
        ) : !page ? (
          <div className="space-y-3">
            <div className="skeleton h-10 w-2/3" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
            <div className="skeleton h-4 w-4/6" />
          </div>
        ) : (
          <article className="card prose-page p-6 sm:p-10">
            {/* Content is authored by the site admin in the Pages editor. */}
            <div dangerouslySetInnerHTML={{ __html: html }} />
            {slug === 'contact' && <ContactForm contactEmail={data?.contactEmail} />}
          </article>
        )}
      </main>

      <SiteFooter settings={data} />
    </div>
  );
}

function ContactForm({ contactEmail }: { contactEmail?: string }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (backendEnabled()) {
      setState('sending');
      try {
        await api.sendContact(form);
        setState('sent');
      } catch {
        setState('error');
      }
    } else {
      // Static Mode: open the visitor's mail client with the message prefilled.
      const to = contactEmail ?? '';
      const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`);
      window.location.href = `mailto:${to}?subject=${encodeURIComponent('Facility map contact')}&body=${body}`;
      setState('sent');
    }
  };

  if (state === 'sent')
    return (
      <p className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
        <Check className="h-4 w-4" /> Thanks — your message is on its way.
      </p>
    );

  return (
    <form onSubmit={submit} className="mt-6 space-y-3 border-t border-ink-100 dark:border-ink-800 pt-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="c-name">Your name</label>
          <input id="c-name" className="input" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="c-email">Email</label>
          <input id="c-email" type="email" className="input" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="c-msg">Message</label>
        <textarea id="c-msg" className="input min-h-[120px]" required value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })} />
      </div>
      {state === 'error' && (
        <p className="text-sm font-semibold text-red-500">Sending failed — please try again.</p>
      )}
      <button type="submit" className="btn-primary" disabled={state === 'sending'}>
        <Send className="h-4 w-4" /> {state === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
