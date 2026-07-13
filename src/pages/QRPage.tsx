import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Download, Link2, Printer, QrCode } from 'lucide-react';
import { useMapData } from '../hooks/useMapData';
import SplashScreen from '../components/map/SplashScreen';
import { buildDeepLink } from '../components/map/MapExperience';
import { copyToClipboard } from '../lib/utils';
import ThemeToggle from '../components/ui/ThemeToggle';

/**
 * Pure-frontend QR generator for printable location codes.
 * Pick a building/floor (and optionally the zone the code will be posted at)
 * and print or download the code.
 */
export default function QRPage() {
  const { data, error, loading } = useMapData();
  const [buildingId, setBuildingId] = useState('');
  const [floorId, setFloorId] = useState('');
  const [hereZoneId, setHereZoneId] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const building = data?.buildings.find((b) => b.id === buildingId) ?? data?.buildings[0];
  const floor = building?.floors.find((f) => f.id === floorId) ?? building?.floors[0];
  const hereZone = floor?.zones.find((z) => z.id === hereZoneId);

  const url = useMemo(() => {
    if (!building || !floor) return '';
    return buildDeepLink({
      buildingId: building.id,
      floorId: floor.id,
      hereZoneId: hereZone?.id ?? null,
      zoneId: null,
    });
  }, [building, floor, hereZone]);

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, {
      width: 640,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#0e131d', light: '#ffffff' },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [url]);

  if (loading || !data) return <SplashScreen error={error} />;

  return (
    <div className="ambient-grid min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5 no-print">
        <Link to="/" className="btn-ghost !px-3">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <div className="flex items-center gap-2 text-sm font-bold">
          <QrCode className="h-4 w-4" /> QR Code Generator
        </div>
        <ThemeToggle />
      </header>

      <main className="mx-auto grid max-w-3xl gap-6 px-5 pb-16 sm:grid-cols-2">
        {/* Controls */}
        <div className="card p-5 no-print">
          <h1 className="font-bold">Create a location code</h1>
          <p className="mt-1 text-sm text-ink-500">
            Print a code and post it at the spot it describes. Scanning opens the map
            with a “You are here” marker.
          </p>

          <label className="label mt-5" htmlFor="qr-building">Building</label>
          <select
            id="qr-building"
            className="input"
            value={building?.id ?? ''}
            onChange={(e) => {
              setBuildingId(e.target.value);
              setFloorId('');
              setHereZoneId('');
            }}
          >
            {data.buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <label className="label mt-4" htmlFor="qr-floor">Floor</label>
          <select
            id="qr-floor"
            className="input"
            value={floor?.id ?? ''}
            onChange={(e) => {
              setFloorId(e.target.value);
              setHereZoneId('');
            }}
          >
            {building?.floors.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          <label className="label mt-4" htmlFor="qr-zone">
            Posted at zone (“You are here”) — optional
          </label>
          <select
            id="qr-zone"
            className="input"
            value={hereZoneId}
            onChange={(e) => setHereZoneId(e.target.value)}
          >
            <option value="">No specific zone</option>
            {floor?.zones.map((z) => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>

          <div className="mt-6 flex flex-wrap gap-2">
            <a
              href={qrDataUrl || undefined}
              download={`qr-${building?.id ?? 'map'}-${floor?.id ?? ''}${hereZone ? `-${hereZone.id}` : ''}.png`}
              className="btn-primary"
              aria-disabled={!qrDataUrl}
            >
              <Download className="h-4 w-4" /> Download PNG
            </a>
            <button type="button" onClick={() => window.print()} className="btn-outline">
              <Printer className="h-4 w-4" /> Print
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={async () => {
                if (await copyToClipboard(url)) {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }
              }}
            >
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Link2 className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>

          <p className="mt-4 break-all rounded-xl bg-ink-100/70 dark:bg-ink-800/70 p-3 font-mono text-[11px] text-ink-500">
            {url}
          </p>
        </div>

        {/* Printable poster */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card flex flex-col items-center p-8 text-center print:shadow-none print:border-none"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink-400">
            {data.companyName}
          </p>
          <h2 className="mt-2 text-xl font-extrabold">Scan to open the facility map</h2>
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR code linking to the facility map${hereZone ? ` at ${hereZone.name}` : ''}`}
              className="mt-5 w-full max-w-[280px] rounded-2xl border border-ink-100 dark:border-ink-800"
            />
          ) : (
            <div className="skeleton mt-5 aspect-square w-full max-w-[280px]" />
          )}
          <p className="mt-5 text-sm font-semibold">
            {building?.name} · {floor?.name}
          </p>
          {hereZone && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 font-semibold">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              You are here: {hereZone.name}
            </p>
          )}
          <p className="mt-4 text-xs text-ink-400">
            Point your phone camera at the code — no app needed.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
