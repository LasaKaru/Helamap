import { HashRouter, Route, Routes } from 'react-router-dom';
import { LanguageProvider } from './lib/i18n';
import LandingPage from './pages/LandingPage';
import MapPage from './pages/MapPage';
import AdminPage from './pages/AdminPage';
import QRPage from './pages/QRPage';

/**
 * HashRouter keeps deep links (QR codes!) working on any static host —
 * GitHub Pages, Netlify, plain Apache/IIS folders — with zero rewrite rules.
 */
export default function App() {
  return (
    <LanguageProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/qr" element={<QRPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </HashRouter>
    </LanguageProvider>
  );
}
