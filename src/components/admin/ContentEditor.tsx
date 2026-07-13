import { useRef, useState } from 'react';
import {
  Building2,
  ChevronRight,
  ImagePlus,
  Layers,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import type { AdminDraft } from '../../hooks/useAdminDraft';
import type { Building, Floor, MapData, Zone } from '../../types';
import { fileToDataUrl, uid } from '../../lib/utils';
import { ZoneIcon } from '../../lib/icons';
import ZoneEditor from './ZoneEditor';

/* ---------- immutable helpers ---------- */

function patchBuilding(data: MapData, id: string, fn: (b: Building) => Building): MapData {
  return { ...data, buildings: data.buildings.map((b) => (b.id === id ? fn(b) : b)) };
}
function patchFloor(data: MapData, bId: string, fId: string, fn: (f: Floor) => Floor): MapData {
  return patchBuilding(data, bId, (b) => ({
    ...b,
    floors: b.floors.map((f) => (f.id === fId ? fn(f) : f)),
  }));
}

/* ---------- main editor ---------- */

export default function ContentEditor({ draft }: { draft: AdminDraft }) {
  const data = draft.data!;
  const [buildingId, setBuildingId] = useState(data.buildings[0]?.id ?? '');
  const [floorId, setFloorId] = useState(data.buildings[0]?.floors[0]?.id ?? '');
  const [editingZone, setEditingZone] = useState<{ zone: Zone; isNew: boolean } | null>(null);

  const building = data.buildings.find((b) => b.id === buildingId) ?? data.buildings[0];
  const floor =
    building?.floors.find((f) => f.id === floorId) ?? building?.floors[0];

  const selectBuilding = (id: string) => {
    setBuildingId(id);
    const b = data.buildings.find((x) => x.id === id);
    setFloorId(b?.floors[0]?.id ?? '');
  };

  /* buildings */
  const addBuilding = () => {
    const b: Building = {
      id: uid('b'),
      name: 'New Building',
      description: '',
      floors: [],
    };
    draft.update((prev) => ({ ...prev, buildings: [...prev.buildings, b] }));
    selectBuilding(b.id);
  };
  const deleteBuilding = (id: string) => {
    const b = data.buildings.find((x) => x.id === id);
    if (!confirm(`Delete building "${b?.name}" and all its floors and zones?`)) return;
    draft.update((prev) => ({
      ...prev,
      buildings: prev.buildings.filter((x) => x.id !== id),
    }));
    if (buildingId === id) selectBuilding(data.buildings.find((x) => x.id !== id)?.id ?? '');
  };

  /* floors */
  const addFloor = () => {
    if (!building) return;
    const f: Floor = {
      id: uid('f'),
      name: 'New Floor',
      level: building.floors.length,
      mapImage: '/maps/main-ground.svg',
      mapWidth: 2000,
      mapHeight: 1400,
      zones: [],
    };
    draft.update((prev) =>
      patchBuilding(prev, building.id, (b) => ({ ...b, floors: [...b.floors, f] })),
    );
    setFloorId(f.id);
  };
  const deleteFloor = (id: string) => {
    if (!building) return;
    const f = building.floors.find((x) => x.id === id);
    if (!confirm(`Delete floor "${f?.name}" and its ${f?.zones.length ?? 0} zones?`)) return;
    draft.update((prev) =>
      patchBuilding(prev, building.id, (b) => ({
        ...b,
        floors: b.floors.filter((x) => x.id !== id),
      })),
    );
    if (floorId === id) setFloorId(building.floors.find((x) => x.id !== id)?.id ?? '');
  };

  /* zones */
  const newZoneTemplate = (): Zone => ({
    id: uid('z'),
    name: 'New Zone',
    shortName: 'Zone',
    color: '#3B82F6',
    icon: 'map-pin',
    description: '',
    details: '',
    safetyNotes: '',
    polygon: [],
    center: [Math.round((floor?.mapWidth ?? 1000) / 2), Math.round((floor?.mapHeight ?? 700) / 2)],
    isHighlighted: false,
  });
  const saveZone = (zone: Zone, isNew: boolean) => {
    if (!building || !floor) return;
    draft.update((prev) =>
      patchFloor(prev, building.id, floor.id, (f) => ({
        ...f,
        zones: isNew
          ? [...f.zones, zone]
          : f.zones.map((z) => (z.id === zone.id ? zone : z)),
      })),
    );
    setEditingZone(null);
  };
  const deleteZone = (id: string) => {
    if (!building || !floor) return;
    const z = floor.zones.find((x) => x.id === id);
    if (!confirm(`Delete zone "${z?.name}"?`)) return;
    draft.update((prev) =>
      patchFloor(prev, building.id, floor.id, (f) => ({
        ...f,
        zones: f.zones.filter((x) => x.id !== id),
      })),
    );
  };

  return (
    <div className="grid items-start gap-4 lg:grid-cols-3">
      {/* Buildings */}
      <Panel
        icon={<Building2 className="h-4 w-4" />}
        title="Buildings"
        onAdd={addBuilding}
        addLabel="Add building"
      >
        {data.buildings.length === 0 && <Empty text="No buildings yet — add your first one." />}
        {data.buildings.map((b) => (
          <EditableRow
            key={b.id}
            active={b.id === building?.id}
            onSelect={() => selectBuilding(b.id)}
            onDelete={() => deleteBuilding(b.id)}
            title={b.name}
            subtitle={`${b.floors.length} floor${b.floors.length === 1 ? '' : 's'}`}
            form={
              <>
                <label className="label">Name</label>
                <input
                  className="input"
                  value={b.name}
                  onChange={(e) =>
                    draft.update((prev) =>
                      patchBuilding(prev, b.id, (x) => ({ ...x, name: e.target.value })),
                    )
                  }
                />
                <label className="label mt-3">Description</label>
                <input
                  className="input"
                  value={b.description}
                  onChange={(e) =>
                    draft.update((prev) =>
                      patchBuilding(prev, b.id, (x) => ({ ...x, description: e.target.value })),
                    )
                  }
                />
              </>
            }
          />
        ))}
      </Panel>

      {/* Floors */}
      <Panel
        icon={<Layers className="h-4 w-4" />}
        title={building ? `Floors — ${building.name}` : 'Floors'}
        onAdd={building ? addFloor : undefined}
        addLabel="Add floor"
      >
        {!building && <Empty text="Select a building first." />}
        {building?.floors.length === 0 && <Empty text="No floors yet." />}
        {building?.floors
          .slice()
          .sort((a, b) => a.level - b.level)
          .map((f) => (
            <EditableRow
              key={f.id}
              active={f.id === floor?.id}
              onSelect={() => setFloorId(f.id)}
              onDelete={() => deleteFloor(f.id)}
              title={f.name}
              subtitle={`Level ${f.level} · ${f.zones.length} zone${f.zones.length === 1 ? '' : 's'}`}
              form={<FloorForm draft={draft} buildingId={building.id} floor={f} />}
            />
          ))}
      </Panel>

      {/* Zones */}
      <Panel
        icon={<MapPin className="h-4 w-4" />}
        title={floor ? `Zones — ${floor.name}` : 'Zones'}
        onAdd={
          floor ? () => setEditingZone({ zone: newZoneTemplate(), isNew: true }) : undefined
        }
        addLabel="Add zone"
      >
        {!floor && <Empty text="Select a floor first." />}
        {floor?.zones.length === 0 && (
          <Empty text="No zones yet — add one and draw its outline on the map." />
        )}
        {floor?.zones.map((z) => (
          <div
            key={z.id}
            className="flex items-center gap-3 rounded-xl border border-ink-100 dark:border-ink-800 p-3"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: z.color }}
            >
              <ZoneIcon name={z.icon} className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{z.name}</p>
              <p className="truncate text-xs text-ink-400">
                {z.polygon.length >= 3
                  ? `${z.polygon.length} points`
                  : '⚠ no outline drawn yet'}
              </p>
            </div>
            <button
              type="button"
              className="btn-ghost !p-2"
              aria-label={`Edit ${z.name}`}
              onClick={() => setEditingZone({ zone: z, isNew: false })}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="btn-ghost !p-2 text-red-500"
              aria-label={`Delete ${z.name}`}
              onClick={() => deleteZone(z.id)}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </Panel>

      {/* Zone editor overlay */}
      {editingZone && floor && (
        <ZoneEditor
          floor={floor}
          zone={editingZone.zone}
          isNew={editingZone.isNew}
          onCancel={() => setEditingZone(null)}
          onSave={(z) => saveZone(z, editingZone.isNew)}
        />
      )}
    </div>
  );
}

/* ---------- floor form (map image upload / path) ---------- */

function FloorForm({
  draft,
  buildingId,
  floor,
}: {
  draft: AdminDraft;
  buildingId: string;
  floor: Floor;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const patch = (fn: (f: Floor) => Floor) =>
    draft.update((prev) => patchFloor(prev, buildingId, floor.id, fn));

  const uploadImage = async (file: File) => {
    if (file.size > 1.5 * 1024 * 1024) {
      alert(
        'That image is larger than 1.5 MB — embedding it would bloat map-data.json. Put the file in /public/maps/ on your host instead and enter its path (e.g. /maps/floor2.png).',
      );
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    const img = new Image();
    img.onload = () =>
      patch((f) => ({
        ...f,
        mapImage: dataUrl,
        mapWidth: img.naturalWidth,
        mapHeight: img.naturalHeight,
      }));
    img.src = dataUrl;
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Name</label>
          <input className="input" value={floor.name}
            onChange={(e) => patch((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="label">Level</label>
          <input className="input" type="number" value={floor.level}
            onChange={(e) => patch((f) => ({ ...f, level: Number(e.target.value) || 0 }))} />
        </div>
      </div>
      <label className="label mt-3">Map image path</label>
      <input
        className="input font-mono text-xs"
        value={floor.mapImage.startsWith('data:') ? '(uploaded image — stored inside the JSON)' : floor.mapImage}
        disabled={floor.mapImage.startsWith('data:')}
        onChange={(e) => patch((f) => ({ ...f, mapImage: e.target.value }))}
        placeholder="/maps/main-ground.svg"
      />
      <div className="mt-2 flex gap-2">
        <button type="button" className="btn-outline !py-2 !text-xs" onClick={() => fileRef.current?.click()}>
          <ImagePlus className="h-3.5 w-3.5" /> Upload image
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className="label">Map width (px)</label>
          <input className="input" type="number" value={floor.mapWidth}
            onChange={(e) => patch((f) => ({ ...f, mapWidth: Number(e.target.value) || 1 }))} />
        </div>
        <div>
          <label className="label">Map height (px)</label>
          <input className="input" type="number" value={floor.mapHeight}
            onChange={(e) => patch((f) => ({ ...f, mapHeight: Number(e.target.value) || 1 }))} />
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-ink-400">
        Tip: keep floor plans in <code>/public/maps/</code> and reference them by path —
        uploads are embedded as base64 and grow the JSON file.
      </p>
    </>
  );
}

/* ---------- small building blocks ---------- */

function Panel({
  icon,
  title,
  onAdd,
  addLabel,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  onAdd?: () => void;
  addLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-4">
      <div className="flex items-center gap-2">
        <span className="text-ink-400">{icon}</span>
        <h2 className="min-w-0 flex-1 truncate text-sm font-bold">{title}</h2>
      </div>
      <div className="mt-3 space-y-2">{children}</div>
      {onAdd && (
        <button type="button" onClick={onAdd} className="btn-outline mt-3 w-full !py-2 !text-xs">
          <Plus className="h-3.5 w-3.5" /> {addLabel}
        </button>
      )}
    </section>
  );
}

function EditableRow({
  active,
  onSelect,
  onDelete,
  title,
  subtitle,
  form,
}: {
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
  title: string;
  subtitle: string;
  form: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`rounded-xl border transition-colors ${
        active
          ? 'border-blue-500/50 bg-blue-500/5'
          : 'border-ink-100 dark:border-ink-800'
      }`}
    >
      <div className="flex items-center gap-2 p-3">
        <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <ChevronRight
            className={`h-4 w-4 shrink-0 transition-transform ${active ? 'text-blue-500' : 'text-ink-300'}`}
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{title}</span>
            <span className="block truncate text-xs text-ink-400">{subtitle}</span>
          </span>
        </button>
        <button
          type="button"
          className="btn-ghost !p-2"
          aria-label={`Edit ${title}`}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button type="button" className="btn-ghost !p-2 text-red-500" aria-label={`Delete ${title}`} onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {open && <div className="border-t border-ink-100 dark:border-ink-800 p-3">{form}</div>}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-ink-200 dark:border-ink-700 p-5 text-center text-xs text-ink-400">
      {text}
    </div>
  );
}
