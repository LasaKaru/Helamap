import { useEffect, useState } from 'react';
import { animate } from 'framer-motion';

/**
 * Shared pieces for the cinematic "shoot view" surfaces (admin dashboard
 * hero, landing hero): live timecode, count-up numbers, stat chips.
 * The `.film-grain` overlay class lives in index.css.
 */

/** Live HH:MM:SS:FF timecode, 25 fps — the director's-monitor touch. */
export function Timecode() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 40);
    return () => clearInterval(t);
  }, []);
  const pad = (n: number) => String(n).padStart(2, '0');
  const frames = pad(Math.floor(now.getMilliseconds() / 40));
  return (
    <span className="tabular-nums" aria-hidden="true">
      TC {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}:{frames}
    </span>
  );
}

export function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.1,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value]);
  return <>{display}</>;
}

export function HeroStat({
  icon,
  value,
  text,
  label,
}: {
  icon: React.ReactNode;
  value?: number;
  text?: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-1.5 text-white/50">{icon}</div>
      <p className="mt-1.5 text-2xl font-extrabold tabular-nums leading-none">
        {value !== undefined ? <CountUp value={value} /> : <span className="text-sm">{text}</span>}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
        {label}
      </p>
    </div>
  );
}
