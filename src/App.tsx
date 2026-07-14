import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from './lib/i18n';
import LandingPage from './pages/LandingPage';
import MapPage from './pages/MapPage';
import PageView from './pages/PageView';
import SplashScreen from './components/map/SplashScreen';

// Code-split the heavy admin bundle (TipTap, bcrypt) and the QR generator so
// the public map stays fast — the #1 priority for Lighthouse scores.
const AdminPage = lazy(() => import('./pages/AdminPage'));
const QRPage = lazy(() => import('./pages/QRPage'));

/**
 * Clean URLs via BrowserRouter for SEO. Static hosts need a SPA fallback —
 * ready-made configs ship with the product: public/_redirects (Netlify),
 * vercel.json, public/.htaccess (Apache), public/web.config (IIS),
 * deploy/nginx.conf, and dist/404.html for GitHub Pages (created by the
 * build script). Legacy #/route links keep working via the redirect below.
 */
export default function App() {
  return (
    <HelmetProvider>
      <LanguageProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <HashRedirect />
          <Suspense fallback={<SplashScreen />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/qr" element={<QRPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/pages/:slug" element={<PageView />} />
              <Route path="*" element={<LandingPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </LanguageProvider>
    </HelmetProvider>
  );
}

/** Support QR codes printed with the old #/map?... hash URLs. */
function HashRedirect() {
  const { hash } = window.location;
  if (hash.startsWith('#/')) {
    window.history.replaceState(null, '', `${import.meta.env.BASE_URL.replace(/\/$/, '')}${hash.slice(1)}`);
    window.location.reload();
  }
  return null;
}
