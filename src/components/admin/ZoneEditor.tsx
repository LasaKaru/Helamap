import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, X } from 'lucide-react';
import type { Floor, Zone, ZoneStatus } from '../../types';
import { ZONE_ICON_NAMES, ZoneIcon } from '../../lib/icons';
import { cn } from '../../lib/utils';
import PolygonEditor from './PolygonEditor';

const ZONE_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16',
  '#F97316', '#64748B',
];

const STATUS_OPTIONS: { value: '' | ZoneStatus; label: string }[] = [
  { value: '', label: 'No status' },
  { value: 'busy', label: 'Busy' },
  { value: 'low-stock', label: 'Low stock' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'closed', label: 'Closed' },
];

/** Quick-start presets for common zone types. */
const ZONE_TEMPLATES: { label: string; patch: Partial<Zone> }[] = [
  {
    label: 'Warehouse zone',
    patch: {
      name: 'Warehouse Zone', shortName: 'Warehouse', icon: 'boxes', color: '#3B82F6',
      tags: ['warehouse'],
      safetyNotes: 'High-visibility vest and safety shoes required. Watch for forklift traffic.',
    },
  },
  {
    label: 'Office room',
    patch: {
      name: 'Office Room', shortName: 'Office', icon: 'briefcase', color: '#10B981',
      tags: ['office'], safetyNotes: '',
    },
  },
  {
    label: 'Production line',
    patch: {
      name: 'Production Line', shortName: 'Production', icon: 'factory', color: '#F59E0B',
      tags: ['production'],
      safetyNotes: 'Hearing protection required. Keep clear of moving machinery.',
    },
  },
  {
    label: 'Safety / first aid',
    patch: {
      name: 'First Aid Point', shortName: 'First Aid', icon: 'heart-pulse', color: '#EF4444',
      tags: ['safety', 'medical'], safetyNotes: '',
    },
  },
  {
    label: 'Meeting room',
    patch: {
      name: 'Meeting Room', shortName: 'Meetings', icon: 'users', color: '#8B5CF6',
      tags: ['office', 'meetings'], safetyNotes: '',
    },
  },
  {
    label: 'Stairs / elevator',
    patch: {
      name: 'Stairwell', shortName: 'Stairs', icon: 'arrow-up-down', color: '#64748B',
      tags: ['stairs'], safetyNotes: '',
    },
  },
];

interface ZoneEditorProps {
  floor: Floor;
  /** All floors of the same building, for the stairs/elevator connector. */
  buildingFloors: Floor[];
  zone: Zone;
  isNew: boolean;
  onSave: (zone: Zone) => void;
  onCancel: () => void;
}

/** Full-screen zone editor: fields on the left, polygon drawing on the right. */
export default function ZoneEditor({
  floor,
  buildingFloors,
  zone,
  isNew,
  onSave,
  onCancel,
}: ZoneEditorProps) {
  const [z, setZ] = useState<Zone>(zone);
  const patch = (p: Partial<Zone>) => setZ((prev) => ({ ...prev, ...p }));
  const otherZones = floor.zones.filter((x) => x.id !== z.id);
  const otherFloors = buildingFloors.filter((f) => f.id !== floor.id);
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
          {isNew && (
            <div>
              <span className="label flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" /> Start from a template
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ZONE_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => patch(tpl.patch)}
                    className="rounded-full border border-ink-200 dark:border-ink-700 px-3 py-1 text-[11px] font-semibold text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>
          )}
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="z-tags">Tags (comma separated)</label>
              <input id="z-tags" className="input font-mono text-xs"
                value={(z.tags ?? []).join(', ')}
                onChange={(e) =>
                  patch({
                    tags: e.target.value
                      .split(',')
                      .map((s) => s.trim().toLowerCase())
                      .filter(Boolean),
                  })
                }
                placeholder="safety, high-traffic" />
            </div>
            <div>
              <label className="label" htmlFor="z-status">Status badge</label>
              <select id="z-status" className="input"
                value={z.status ?? ''}
                onChange={(e) =>
                  patch({ status: (e.target.value || undefined) as ZoneStatus | undefined })
                }>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {otherFloors.length > 0 && (
            <div>
              <label className="label" htmlFor="z-connect">
                Stairs / elevator — connects to floor
              </label>
              <select id="z-connect" className="input"
                value={z.connectsToFloorId ?? ''}
                onChange={(e) => patch({ connectsToFloorId: e.target.value || undefined })}>
                <option value="">Not a floor connector</option>
                {otherFloors.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          )}

          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
            <input type="checkbox" checked={Boolean(z.isHighlighted)}
              onChange={(e) => patch({ isHighlighted: e.target.checked })}
              className="h-4 w-4 rounded accent-blue-600" />
            Highlight this zone on the map
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
            <input type="checkbox" checked={Boolean(z.isExit)}
              onChange={(e) => patch({ isExit: e.target.checked })}
              className="h-4 w-4 rounded accent-red-600" />
            Emergency exit (highlighted in Emergency mode)
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
