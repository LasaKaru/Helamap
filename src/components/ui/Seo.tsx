import { Helmet } from 'react-helmet-async';
import type { AppSettings } from '../../types';

interface SeoProps {
  /** Page-specific title; combined with the site title. */
  title?: string;
  description?: string;
  settings?: (Pick<AppSettings, 'appName' | 'companyName' | 'seoTitle' | 'seoDescription' | 'website' | 'logo'> & {
    address?: string;
  }) | null;
  /** Extra JSON-LD to embed (e.g. Organization on the landing page). */
  jsonLd?: Record<string, unknown>;
}

/** Dynamic meta tags: title, description, Open Graph, Twitter, JSON-LD. */
export default function Seo({ title, description, settings, jsonLd }: SeoProps) {
  const siteTitle = settings?.seoTitle || settings?.appName || 'FacilityFlow';
  const fullTitle = title ? `${title} · ${siteTitle}` : siteTitle;
  const desc =
    description ||
    settings?.seoDescription ||
    'Interactive facility wayfinding map — scan, explore, find your way.';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={siteTitle} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}

/** Organization JSON-LD built from admin branding settings. */
export function organizationJsonLd(settings: SeoProps['settings']): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings?.companyName || settings?.appName || 'FacilityFlow',
    ...(settings?.website ? { url: settings.website } : {}),
    ...(settings?.address ? { address: settings.address } : {}),
  };
}
