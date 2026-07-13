import { useRef, useState } from 'react';
import { Download, FileUp, History, RotateCcw, Undo2 } from 'lucide-react';
import type { AdminDraft } from '../../hooks/useAdminDraft';
import { countStats } from '../../lib/data';
import { fireConfetti } from '../../lib/confetti';
import { formatDate } from '../../lib/utils';

export default function ExportPanel({ draft }: { draft: AdminDraft }) {
  const data = draft.data!;
  const stats = countStats(data);
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const jsonSizeKb = Math.round(JSON.stringify(data).length / 1024);

  const doExport = () => {
    draft.exportData();
    fireConfetti();
    setMessage({
      kind: 'ok',
      text: 'map-data.json downloaded! Now replace /data/map-data.json on your host to publish.',
    });
  };

  const doImport = async (file: File) => {
    try {
      const json = JSON.parse(await file.text()) as unknown;
      draft.importData(json);
      setMessage({ kind: 'ok', text: `Imported "${file.name}" into the draft.` });
    } catch (e) {
      setMessage({ kind: 'err', text: `Import failed: ${(e as Error).message}` });
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Export */}
      <section className="card p-6 text-center">
        <h1 className="text-lg font-bold">Save & Export</h1>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-500">
          Downloads the complete <code className="rounded bg-ink-100 dark:bg-ink-800 px-1.5 py-0.5 text-xs">map-data.json</code> —{' '}
          {stats.buildings} buildings, {stats.floors} floors, {stats.zones} zones (~{jsonSizeKb} KB).
        </p>
        <button type="button" onClick={doExport} className="btn-success mt-5 !px-8 !py-3.5 !text-base">
          <Download className="h-5 w-5" />
          Export map-data.json
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-400">
          <History className="h-3.5 w-3.5" />
          Last export: {formatDate(draft.lastExport ?? undefined)}
        </p>

        {message && (
          <p
            role="status"
            className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
              message.kind === 'ok'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
            }`}
          >
            {message.text}
          </p>
        )}

        <ol className="mx-auto mt-6 max-w-md space-y-1.5 text-left text-xs text-ink-500">
          <li>1. Export the file above.</li>
          <li>2. Overwrite <code className="rounded bg-ink-100 dark:bg-ink-800 px-1 py-0.5">/data/map-data.json</code> in your deployed site folder (Netlify, Vercel, GitHub Pages, IIS/Apache…).</li>
          <li>3. Done — the next QR scan loads the new map. No rebuild needed.</li>
        </ol>
      </section>

      {/* Import / reset */}
      <section className="card p-6">
        <h2 className="font-bold">Restore & recovery</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <button type="button" className="btn-outline" onClick={() => fileRef.current?.click()}>
            <FileUp className="h-4 w-4" /> Import JSON
          </button>
          <button
            type="button"
            className="btn-outline"
            onClick={async () => {
              if (confirm('Discard the local draft and reload the live map-data.json from the server?'))
                await draft.discardDraft();
            }}
          >
            <Undo2 className="h-4 w-4" /> Discard draft
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              if (confirm('Replace the current draft with the bundled sample facility data?'))
                draft.resetToSample();
            }}
          >
            <RotateCcw className="h-4 w-4" /> Reset to sample
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) doImport(f);
            e.target.value = '';
          }}
        />
        <p className="mt-4 text-xs leading-relaxed text-ink-400">
          Import loads a previously exported file into the draft. Discard throws away
          local edits and re-reads the deployed file. Reset restores the demo facility.
        </p>
      </section>
    </div>
  );
}
