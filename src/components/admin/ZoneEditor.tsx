import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import type { Floor, Zone } from '../../types';
import { ZONE_ICON_NAMES, ZoneIcon } from '../../lib/icons';
import { cn } from '../../lib/utils';
import PolygonEditor from './PolygonEditor';

const ZONE_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16',
  '#F97316', '#64748B',
];

interface ZoneEditorProps {
  floor: Floor;
  zone: Zone;
  isNew: boolean;
  onSave: (zone: Zone) => void;
  onCancel: () => void;
}

/** Full-screen zone editor: fields on the left, polygon drawing on the right. */
export default function ZoneEditor({ floor, zone, isNew, onSave, onCancel }: ZoneEditorProps) {
  const [z, setZ] = useState<Zone>(zone);
  const patch = (p: Partial<Zone>) => setZ((prev) => ({ ...prev, ...p }));
  const otherZones = floor.zones.filter((x) => x.id !== z.id);
  const valid = z.name.trim().length > 0 && z.shortName.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col bg-ink-50 dark:bg-ink-950"
      role="dialog"
      aria-label={isNew ? 'Create zone' : `Edit zone ${zone.name}`}
    >
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-ink-100 dark:border-ink-800 bg-white/85 dark:bg-ink-950/85 px-4 py-3 backdrop-blur-xl">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: z.color }}
        >
          <ZoneIcon name={z.icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-bold">
            {isNew ? 'New zone' : `Editing: ${zone.name}`}
          </h2>
          <p className="truncate text-[11px] text-ink-400">{floor.name}</p>
        </div>
        <button type="button" className="btn-ghost" onClick={onCancel}>
          <X className="h-4 w-4" /> Cancel
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={!valid}
          onClick={() => onSave(z)}
        >
          <Check className="h-4 w-4" /> Save zone
        </button>
      </header>

      {/* Body */}
      <div className="grid flex-1 gap-5 overflow-y-auto p-4 lg:grid-cols-[400px_1fr] lg:overflow-hidden">
        {/* Fields */}
        <div className="space-y-4 lg:overflow-y-auto lg:pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label" htmlFor="z-name">Zone name</label>
              <input id="z-name" className="input" value={z.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder="Main Inventory Section" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="label" htmlFor="z-short">Short label (map pill)</label>
              <input id="z-short" className="input" value={z.shortName}
                onChange={(e) => patch({ shortName: e.target.value })}
                placeholder="Inventory" maxLength={18} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="label" htmlFor="z-photo">Photo path (optional)</label>
              <input id="z-photo" className="input font-mono text-xs" value={z.photo ?? ''}
                onChange={(e) => patch({ photo: e.target.value || undefined })}
                placeholder="/photos/inventory.jpg" />
            </div>
          </div>

          {/* Color */}
          <div>
            <span className="label">Zone color</span>
            <div className="flex flex-wrap items-center gap-2">
              {ZONE_COLORS.map((c) => (
                <button key={c} type="button" aria-label={`Color ${c}`}
                  onClick={() => patch({ color: c })}
                  className="h-8 w-8 rounded-lg transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    boxShadow: z.color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined,
                  }} />
              ))}
              <input type="color" aria-label="Custom color" value={z.color}
                onChange={(e) => patch({ color: e.target.value })}
                className="h-8 w-10 cursor-pointer rounded-lg border border-ink-200 dark:border-ink-700 bg-transparent" />
            </div>
          </div>

          {/* Icon */}
          <div>
            <span className="label">Icon</span>
            <div className="grid grid-cols-8 gap-1.5">
              {ZONE_ICON_NAMES.map((name) => (
                <button key={name} type="button" title={name} aria-label={`Icon ${name}`}
                  onClick={() => patch({ icon: name })}
                  className={cn(
                    'flex aspect-square items-center justify-center rounded-lg border transition-colors',
                    z.icon === name
                      ? 'border-transparent text-white'
                      : 'border-ink-200 dark:border-ink-700 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800',
                  )}
                  style={z.icon === name ? { backgroundColor: z.color } : undefined}
                >
                  <ZoneIcon name={name} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="z-desc">Description</label>
            <textarea id="z-desc" className="input min-h-[72px]" value={z.description}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="What happens in this zone?" />
          </div>
          <div>
            <label className="label" htmlFor="z-details">Details (one bullet per line)</label>
            <textarea id="z-details" className="input min-h-[96px] font-mono text-xs" value={z.details ?? ''}
              onChange={(e) => patch({ details: e.target.value })}
              placeholder={'• Capacity: 12,000 pallets\n• Contact: inventory@company.com\n• Open 24/7'} />
          </div>
          <div>
            <label className="label" htmlFor="z-safety">Safety notes (optional)</label>
            <textarea id="z-safety" className="input min-h-[72px]" value={z.safetyNotes ?? ''}
              onChange={(e) => patch({ safetyNotes: e.target.value || undefined })}
              placeholder="PPE requirements, hazards…" />
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
            <input type="checkbox" checked={Boolean(z.isHighlighted)}
              onChange={(e) => patch({ isHighlighted: e.target.checked })}
              className="h-4 w-4 rounded accent-blue-600" />
            Highlight this zone on the map
          </label>
        </div>

        {/* Polygon editor */}
        <div className="lg:overflow-y-auto">
          <PolygonEditor
            floor={floor}
            otherZones={otherZones}
            polygon={z.polygon}
            color={z.color}
            onChange={(polygon, center) => patch({ polygon, center })}
          />
        </div>
      </div>
    </motion.div>
  );
}
