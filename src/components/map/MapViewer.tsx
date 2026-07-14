import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  TransformWrapper,
  TransformComponent,
  type ReactZoomPanPinchRef,
} from 'react-zoom-pan-pinch';
import { motion } from 'framer-motion';
import { Locate, Maximize, Minus, Plus } from 'lucide-react';
import type { Floor, Zone } from '../../types';
import { assetUrl, pointsToSvg } from '../../lib/utils';
import { STATUS_COLORS, useI18n } from '../../lib/i18n';

interface MapViewerProps {
  floor: Floor;
  selectedZoneId: string | null;
  onSelectZone: (id: string | null) => void;
  /** Zone the visitor is standing in (from the QR deep link `here` param). */
  hereZoneId?: string | null;
  /** Draw an animated route from `here` to the selected zone. */
  showDirections?: boolean;
  /** Emergency mode: exits pulse red, everything else is dimmed. */
  emergencyMode?: boolean;
  /** Hide the floating controls (used inside the admin polygon editor preview). */
  hideControls?: boolean;
}

/**
 * Pure SVG floor map inside react-zoom-pan-pinch.
 * The SVG is rendered at its natural pixel size (mapWidth × mapHeight), so
 * content coordinates === map data coordinates, which keeps all the
 * zoom/center math exact.
 */
export default function MapViewer({
  floor,
  selectedZoneId,
  onSelectZone,
  hereZoneId,
  showDirections,
  emergencyMode,
  hideControls,
}: MapViewerProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<ReactZoomPanPinchRef>(null);
  const [container, setContainer] = useState<{ w: number; h: number } | null>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () =>
      setContainer({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fitScale = useMemo(() => {
    if (!container) return 0.2;
    return Math.min(container.w / floor.mapWidth, container.h / floor.mapHeight) * 0.94;
  }, [container, floor.mapWidth, floor.mapHeight]);

  const centerOnZone = useCallback(
    (zone: Zone, zoomFactor = 2.1, animMs = 450, verticalBias = 0.5) => {
      const ref = wrapperRef.current;
      const box = containerRef.current;
      if (!ref || !box) return;
      const target = Math.min(fitScale * zoomFactor, fitScale * 8);
      const [cx, cy] = zone.center;
      ref.setTransform(
        box.clientWidth / 2 - cx * target,
        box.clientHeight * verticalBias - cy * target,
        target,
        animMs,
        'easeOut',
      );
    },
    [fitScale],
  );

  // Smoothly frame the selected zone whenever it changes — biased toward the
  // upper part of the viewport so the bottom sheet doesn't cover it.
  useEffect(() => {
    if (!selectedZoneId) return;
    const zone = floor.zones.find((z) => z.id === selectedZoneId);
    if (zone) centerOnZone(zone, 2.1, 450, 0.34);
  }, [selectedZoneId, floor, centerOnZone]);

  const resetView = useCallback(() => {
    wrapperRef.current?.centerView(fitScale, 350, 'easeOut');
  }, [fitScale]);

  const hereZone = hereZoneId ? floor.zones.find((z) => z.id === hereZoneId) : undefined;
  const selectedZone = selectedZoneId
    ? floor.zones.find((z) => z.id === selectedZoneId)
    : undefined;

  const directionsPath = useMemo(() => {
    if (!showDirections || !hereZone || !selectedZone || hereZone.id === selectedZone.id)
      return null;
    const [x1, y1] = hereZone.center;
    const [x2, y2] = selectedZone.center;
    // Gentle curve perpendicular to the straight line — feels like a route.
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const off = Math.min(len * 0.2, 140);
    const cx = mx - (dy / len) * off;
    const cy = my + (dx / len) * off;
    return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  }, [showDirections, hereZone, selectedZone]);

  const labelScale = 1 / Math.max(scale, 0.01);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden touch-none">
      {container && (
        <motion.div
          key={floor.id}
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="h-full w-full"
        >
        <TransformWrapper
          key={`${floor.id}-${fitScale.toFixed(4)}`}
          ref={wrapperRef}
          initialScale={fitScale}
          minScale={fitScale * 0.6}
          maxScale={fitScale * 9}
          centerOnInit
          doubleClick={{ mode: 'zoomIn', step: 0.7 }}
          wheel={{ step: 0.15 }}
          pinch={{ step: 6 }}
          onTransformed={(ref) => setScale(ref.state.scale)}
        >
          <TransformComponent
            wrapperStyle={{ width: '100%', height: '100%' }}
            contentStyle={{ width: floor.mapWidth, height: floor.mapHeight }}
          >
            <svg
              width={floor.mapWidth}
              height={floor.mapHeight}
              viewBox={`0 0 ${floor.mapWidth} ${floor.mapHeight}`}
              role="img"
              aria-label={`Floor plan of ${floor.name}`}
              onClick={() => onSelectZone(null)}
            >
              <image
                href={assetUrl(floor.mapImage)}
                width={floor.mapWidth}
                height={floor.mapHeight}
                className="floorplan-image"
                preserveAspectRatio="xMidYMid slice"
              />

              {/* Zone polygons */}
              {floor.zones.map((zone) => (
                <ZonePolygon
                  key={zone.id}
                  zone={zone}
                  selected={zone.id === selectedZoneId}
                  emergencyMode={emergencyMode}
                  onSelect={() => onSelectZone(zone.id)}
                />
              ))}

              {/* Animated directions route */}
              {directionsPath && selectedZone && (
                <g pointerEvents="none">
                  <motion.path
                    d={directionsPath}
                    fill="none"
                    stroke={selectedZone.color}
                    strokeWidth={7 * labelScale + 4}
                    strokeLinecap="round"
                    strokeDasharray="2 24"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.1, ease: 'easeInOut' }}
                  />
                  <motion.circle
                    r={9 * labelScale + 5}
                    fill={selectedZone.color}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    cx={selectedZone.center[0]}
                    cy={selectedZone.center[1]}
                  />
                </g>
              )}

              {/* Zone labels — inverse-scaled so they stay readable at any zoom */}
              {floor.zones.map((zone) => (
                <ZoneLabel
                  key={zone.id}
                  zone={zone}
                  inverseScale={labelScale}
                  selected={zone.id === selectedZoneId}
                  emergencyMode={emergencyMode}
                  exitLabel={t.exit}
                  onSelect={() => onSelectZone(zone.id)}
                />
              ))}

              {/* You-are-here pulsing marker */}
              {hereZone && (
                <g
                  transform={`translate(${hereZone.center[0]}, ${hereZone.center[1] + 34 * labelScale}) scale(${labelScale})`}
                  pointerEvents="none"
                >
                  <circle
                    r={16}
                    fill="#2563EB"
                    opacity={0.35}
                    className="animate-pulse-ring"
                    style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                  />
                  <circle r={11} fill="#2563EB" stroke="#fff" strokeWidth={3.5} />
                  <text
                    y={34}
                    textAnchor="middle"
                    fontSize={15}
                    fontWeight={700}
                    fill="#2563EB"
                    stroke="#ffffff"
                    strokeWidth={4}
                    paintOrder="stroke"
                  >
                    {t.youAreHere}
                  </text>
                </g>
              )}
            </svg>
          </TransformComponent>
        </TransformWrapper>
        </motion.div>
      )}

      {!hideControls && (
        <div className="absolute bottom-28 right-3 z-10 flex flex-col gap-2 no-print">
          <MapButton label="Zoom in" onClick={() => wrapperRef.current?.zoomIn(0.5)}>
            <Plus className="h-5 w-5" />
          </MapButton>
          <MapButton label="Zoom out" onClick={() => wrapperRef.current?.zoomOut(0.5)}>
            <Minus className="h-5 w-5" />
          </MapButton>
          <MapButton label="Reset view" onClick={resetView}>
            <Maximize className="h-5 w-5" />
          </MapButton>
          {hereZone && (
            <MapButton label="Center on my location" onClick={() => centerOnZone(hereZone)}>
              <Locate className="h-5 w-5 text-blue-500" />
            </MapButton>
          )}
        </div>
      )}
    </div>
  );
}

function MapButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="glass flex h-11 w-11 items-center justify-center rounded-xl text-ink-700 dark:text-ink-200 transition-transform active:scale-90"
    >
      {children}
    </button>
  );
}

function ZonePolygon({
  zone,
  selected,
  emergencyMode,
  onSelect,
}: {
  zone: Zone;
  selected: boolean;
  emergencyMode?: boolean;
  onSelect: () => void;
}) {
  const downPos = useRef<{ x: number; y: number } | null>(null);
  if (zone.polygon.length < 3) return null;

  const isExit = Boolean(zone.isExit);
  const color = emergencyMode && isExit ? '#EF4444' : zone.color;
  const fillAnim =
    emergencyMode
      ? isExit
        ? { fillOpacity: [0.35, 0.6, 0.35] }
        : { fillOpacity: 0.06 }
      : { fillOpacity: selected ? 0.45 : zone.isHighlighted ? 0.38 : 0.22 };

  return (
    <motion.polygon
      points={pointsToSvg(zone.polygon)}
      fill={color}
      stroke={color}
      strokeWidth={selected || (emergencyMode && isExit) ? 3.5 : 2}
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
      initial={false}
      animate={fillAnim}
      whileHover={emergencyMode ? undefined : { fillOpacity: 0.4 }}
      transition={
        emergencyMode && isExit
          ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 0.25 }
      }
      style={{
        cursor: 'pointer',
        filter:
          selected || (emergencyMode && isExit)
            ? `drop-shadow(0 0 14px ${color})`
            : undefined,
      }}
      role="button"
      aria-label={`Zone: ${zone.name}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect();
      }}
      onPointerDown={(e) => {
        downPos.current = { x: e.clientX, y: e.clientY };
      }}
      onClick={(e) => {
        e.stopPropagation();
        // Ignore "clicks" that were actually the end of a pan gesture.
        const d = downPos.current;
        if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 10) return;
        onSelect();
      }}
    />
  );
}

function ZoneLabel({
  zone,
  inverseScale,
  selected,
  emergencyMode,
  exitLabel,
  onSelect,
}: {
  zone: Zone;
  inverseScale: number;
  selected: boolean;
  emergencyMode?: boolean;
  exitLabel: string;
  onSelect: () => void;
}) {
  const [cx, cy] = zone.center;
  const isExit = Boolean(zone.isExit);
  const text = emergencyMode && isExit ? `⬆ ${exitLabel}` : zone.shortName;
  const accent = emergencyMode && isExit ? '#EF4444' : zone.color;
  const statusColor = zone.status ? STATUS_COLORS[zone.status] : null;
  const width = text.length * 8.2 + 30 + (statusColor ? 14 : 0);
  const dimmed = emergencyMode && !isExit;
  return (
    <g
      transform={`translate(${cx}, ${cy}) scale(${inverseScale})`}
      style={{ cursor: 'pointer' }}
      opacity={dimmed ? 0.25 : 1}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      aria-hidden="true"
    >
      <rect
        x={-width / 2}
        y={-15}
        width={width}
        height={30}
        rx={15}
        className="fill-white dark:fill-ink-900"
        fillOpacity={selected ? 1 : 0.92}
        stroke={accent}
        strokeOpacity={selected || (emergencyMode && isExit) ? 1 : 0.55}
        strokeWidth={selected || (emergencyMode && isExit) ? 2.5 : 1.5}
      />
      <circle cx={-width / 2 + 15} cy={0} r={5} fill={accent} />
      <text
        x={statusColor ? 1 : 8}
        y={5}
        textAnchor="middle"
        fontSize={13.5}
        fontWeight={650}
        className="fill-ink-800 dark:fill-ink-100"
      >
        {text}
      </text>
      {statusColor && (
        <circle cx={width / 2 - 13} cy={0} r={5} fill={statusColor}>
          <animate
            attributeName="opacity"
            values="1;0.35;1"
            dur="1.6s"
            repeatCount="indefinite"
          />
        </circle>
      )}
    </g>
  );
}
