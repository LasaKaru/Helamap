import { useCallback, useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Check,
  ExternalLink,
  FileText,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Undo2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AdminDraft } from '../../hooks/useAdminDraft';
import type { PageContent } from '../../types';
import { DEFAULT_PAGES } from '../../lib/defaultPages';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';

/**
 * Rich-text editor (TipTap) for the legal/company pages.
 * Static Mode → pages live inside map-data.json (export to publish).
 * Backend Mode → pages are saved straight to the database.
 */
export default function PagesEditor({ draft }: { draft: AdminDraft }) {
  const [slug, setSlug] = useState(DEFAULT_PAGES[0].slug);
  const [title, setTitle] = useState('');
  const [initialHtml, setInitialHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: { attributes: { 'aria-label': 'Page content editor' } },
  });

  // Load the selected page from the active source.
  const loadPage = useCallback(
    async (targetSlug: string) => {
      setLoading(true);
      setError(null);
      setSaved(false);
      let page: PageContent | undefined;
      if (draft.backendMode) {
        try {
          const res = await api.getPage(targetSlug);
          page = { slug: targetSlug, title: res.page.title, html: res.page.html };
        } catch {
          /* fall back below */
        }
      }
      page ??=
        draft.data?.pages?.find((p) => p.slug === targetSlug) ??
        DEFAULT_PAGES.find((p) => p.slug === targetSlug);
      setTitle(page?.title ?? targetSlug);
      setInitialHtml(page?.html ?? '');
      setLoading(false);
    },
    [draft.backendMode, draft.data?.pages],
  );

  useEffect(() => {
    loadPage(slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (editor && !loading) editor.commands.setContent(initialHtml);
  }, [editor, initialHtml, loading]);

  const save = async () => {
    if (!editor) return;
    const html = editor.getHTML();
    setError(null);
    try {
      if (draft.backendMode) {
        await api.savePage(slug, { title, html });
      } else {
        draft.update((prev) => {
          const pages = [...(prev.pages ?? [])];
          const idx = pages.findIndex((p) => p.slug === slug);
          const page: PageContent = { slug, title, html, updatedAt: new Date().toISOString() };
          if (idx >= 0) pages[idx] = page;
          else pages.push(page);
          return { ...prev, pages };
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[240px_1fr]">
      {/* Page list */}
      <nav className="card p-3" aria-label="Editable pages">
        <p className="label !mb-2 px-1">Pages</p>
        {DEFAULT_PAGES.map((p) => (
          <button
            key={p.slug}
            type="button"
            onClick={() => setSlug(p.slug)}
            aria-current={slug === p.slug ? 'page' : undefined}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
              slug === p.slug
                ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900'
                : 'text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800',
            )}
          >
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{p.title}</span>
          </button>
        ))}
        <p className="mt-3 px-1 text-[11px] leading-relaxed text-ink-400">
          {draft.backendMode
            ? 'Saved pages go live on the server immediately.'
            : 'Pages are stored in map-data.json — export & replace the file to publish.'}
        </p>
      </nav>

      {/* Editor */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="input max-w-sm !py-2 font-semibold"
            aria-label="Page title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="flex-1" />
          <Link to={`/pages/${slug}`} target="_blank" className="btn-ghost !px-3 !text-xs">
            <ExternalLink className="h-3.5 w-3.5" /> Preview
          </Link>
          <button type="button" className="btn-primary" onClick={save} disabled={loading}>
            <Check className="h-4 w-4" /> {saved ? 'Saved!' : 'Save page'}
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {/* Toolbar */}
        {editor && (
          <div className="mt-4 flex flex-wrap gap-1 rounded-xl border border-ink-200 dark:border-ink-700 p-1.5">
            <ToolButton label="Bold" active={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}>
              <Bold className="h-4 w-4" />
            </ToolButton>
            <ToolButton label="Italic" active={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}>
              <Italic className="h-4 w-4" />
            </ToolButton>
            <span className="mx-1 w-px bg-ink-200 dark:bg-ink-700" />
            <ToolButton label="Heading 2" active={editor.isActive('heading', { level: 2 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
              <Heading2 className="h-4 w-4" />
            </ToolButton>
            <ToolButton label="Heading 3" active={editor.isActive('heading', { level: 3 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
              <Heading3 className="h-4 w-4" />
            </ToolButton>
            <span className="mx-1 w-px bg-ink-200 dark:bg-ink-700" />
            <ToolButton label="Bullet list" active={editor.isActive('bulletList')}
              onClick={() => editor.chain().focus().toggleBulletList().run()}>
              <List className="h-4 w-4" />
            </ToolButton>
            <ToolButton label="Numbered list" active={editor.isActive('orderedList')}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}>
              <ListOrdered className="h-4 w-4" />
            </ToolButton>
            <span className="mx-1 w-px bg-ink-200 dark:bg-ink-700" />
            <ToolButton label="Undo" onClick={() => editor.chain().focus().undo().run()}>
              <Undo2 className="h-4 w-4" />
            </ToolButton>
            <ToolButton label="Redo" onClick={() => editor.chain().focus().redo().run()}>
              <Redo2 className="h-4 w-4" />
            </ToolButton>
          </div>
        )}

        <div className={cn('tiptap-editor prose-page mt-3', loading && 'opacity-40 pointer-events-none')}>
          <EditorContent editor={editor} />
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-ink-400">
          Placeholders like <code>[COMPANY NAME]</code>, <code>[CONTACT EMAIL]</code>,{' '}
          <code>[PHONE NUMBER]</code> and <code>[COMPANY ADDRESS]</code> are replaced
          automatically on the public page using your branding settings.
        </p>
      </div>
    </div>
  );
}

function ToolButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
        active
          ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900'
          : 'text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800',
      )}
    >
      {children}
    </button>
  );
}
