import { useCallback, useRef, useState } from 'react';
import { Eraser, Undo2 } from 'lucide-react';
import type { Floor, Point, Zone } from '../../types';
import { assetUrl, pointsToSvg, polygonCenter } from '../../lib/utils';

interface PolygonEditorProps {
  floor: Floor;
  /** Zones other than the one being edited, drawn as faint context outlines. */
  otherZones: Zone[];
  polygon: Point[];
  color: string;
  onChange: (polygon: Point[], center: Point) => void;
}

/**
 * Click on the floor plan to add polygon points; drag existing points to
 * adjust. The zone center is recalculated automatically on every change.
 * The SVG is rendered at 100% width with height following the viewBox
 * aspect ratio, so client → map coordinate conversion is a simple scale.
 */
export default function PolygonEditor({
  floor,
  otherZones,
  polygon,
  color,
  onChange,
}: PolygonEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const suppressClick = useRef(false);

  const toMapCoords = useCallback(
    (clientX: number, clientY: number): Point => {
      const svg = svgRef.current!;
      const rect = svg.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * floor.mapWidth;
      const y = ((clientY - rect.top) / rect.height) * floor.mapHeight;
      return [
        Math.round(Math.min(Math.max(x, 0), floor.mapWidth)),
        Math.round(Math.min(Math.max(y, 0), floor.mapHeight)),
      ];
    },
    [floor.mapWidth, floor.mapHeight],
  );

  const commit = (points: Point[]) => onChange(points, polygonCenter(points));

  const addPoint = (e: React.MouseEvent) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    commit([...polygon, toMapCoords(e.clientX, e.clientY)]);
  };

  const startDrag = (index: number) => (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDragIndex(index);
  };
  const onDrag = (e: React.PointerEvent) => {
    if (dragIndex === null) return;
    suppressClick.current = true;
    const p = toMapCoords(e.clientX, e.clientY);
    commit(polygon.map((pt, i) => (i === dragIndex ? p : pt)));
  };
  const endDrag = () => {
    setDragIndex(null);
    // Let the trailing click event (fired after pointerup) be swallowed once,
    // then re-enable click-to-add.
    setTimeout(() => {
      suppressClick.current = false;
    }, 0);
  };

  const center = polygonCenter(polygon);
  const handleRadius = Math.max(floor.mapWidth, floor.mapHeight) * 0.009;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto text-xs font-medium text-ink-500">
          <b className="text-ink-700 dark:text-ink-200">Tap the plan</b> to add points ·
          drag points to adjust · {polygon.length} point{polygon.length === 1 ? '' : 's'}
        </p>
        <button
          type="button"
          className="btn-outline !px-3 !py-1.5 !text-xs"
          disabled={polygon.length === 0}
          onClick={() => commit(polygon.slice(0, -1))}
        >
          <Undo2 className="h-3.5 w-3.5" /> Delete last
        </button>
        <button
          type="button"
          className="btn-danger !px-3 !py-1.5 !text-xs"
          disabled={polygon.length === 0}
          onClick={() => confirm('Clear all polygon points?') && commit([])}
        >
          <Eraser className="h-3.5 w-3.5" /> Clear
        </button>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-ink-200 dark:border-ink-700 bg-ink-100 dark:bg-ink-900">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${floor.mapWidth} ${floor.mapHeight}`}
          className="block w-full cursor-crosshair touch-none select-none"
          style={{ height: 'auto' }}
          onClick={addPoint}
          onPointerMove={onDrag}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          role="application"
          aria-label="Polygon editor — click to add points"
        >
          <image
            href={assetUrl(floor.mapImage)}
            width={floor.mapWidth}
            height={floor.mapHeight}
            className="floorplan-image"
          />

          {/* Context: other zones on this floor */}
          {otherZones.map(
            (z) =>
              z.polygon.length >= 3 && (
                <polygon
                  key={z.id}
                  points={pointsToSvg(z.polygon)}
                  fill={z.color}
                  fillOpacity={0.08}
                  stroke={z.color}
                  strokeOpacity={0.35}
                  strokeWidth={2}
                  strokeDasharray="10 8"
                  pointerEvents="none"
                />
              ),
          )}

          {/* The polygon being drawn */}
          {polygon.length >= 2 && (
            <polygon
              points={pointsToSvg(polygon)}
              fill={color}
              fillOpacity={0.3}
              stroke={color}
              strokeWidth={3}
              strokeLinejoin="round"
              pointerEvents="none"
            />
          )}
          {polygon.length === 1 && (
            <circle cx={polygon[0][0]} cy={polygon[0][1]} r={handleRadius * 0.6} fill={color} pointerEvents="none" />
          )}

          {/* Auto-calculated center */}
          {polygon.length >= 3 && (
            <g pointerEvents="none">
              <circle cx={center[0]} cy={center[1]} r={handleRadius * 0.55} fill="#ffffff" stroke={color} strokeWidth={3} />
              <circle cx={center[0]} cy={center[1]} r={handleRadius * 0.2} fill={color} />
            </g>
          )}

          {/* Drag handles */}
          {polygon.map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={handleRadius}
              fill="#ffffff"
              stroke={color}
              strokeWidth={4}
              style={{ cursor: 'grab' }}
              onPointerDown={startDrag(i)}
              onClick={(e) => e.stopPropagation()}
            />
          ))}
        </svg>
      </div>

      <p className="mt-2 text-[11px] text-ink-400">
        Zone center (auto): {polygon.length >= 3 ? `${center[0]}, ${center[1]}` : '—'} ·
        at least 3 points are needed for the zone to appear on the map.
      </p>
    </div>
  );
}
