import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Eye,
  FileJson,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from 'lucide-react';
import { ADMIN_SESSION_KEY } from '../config';
import { useAdminDraft } from '../hooks/useAdminDraft';
import { api, backendEnabled, currentUser } from '../lib/api';
import { cn } from '../lib/utils';
import AdminLogin from '../components/admin/AdminLogin';
import AdminDashboard from '../components/admin/AdminDashboard';
import SettingsEditor from '../components/admin/SettingsEditor';
import ContentEditor from '../components/admin/ContentEditor';
import ExportPanel from '../components/admin/ExportPanel';
import UsersManager from '../components/admin/UsersManager';
import PagesEditor from '../components/admin/PagesEditor';
import MapExperience from '../components/map/MapExperience';
import ThemeToggle from '../components/ui/ThemeToggle';
import Logo from '../components/ui/Logo';

type Tab = 'dashboard' | 'settings' | 'content' | 'pages' | 'users' | 'preview' | 'export';

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(ADMIN_SESSION_KEY) === '1' || api.isAuthenticated(),
  );
  const [tab, setTab] = useState<Tab>('dashboard');
  const draft = useAdminDraft();

  const user = currentUser();
  const canManageUsers =
    draft.backendMode && (user?.role === 'super_admin' || user?.role === 'facility_manager');

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
    { id: 'content', label: 'Buildings & Zones', icon: <Building2 className="h-4 w-4" /> },
    { id: 'pages', label: 'Pages', icon: <FileText className="h-4 w-4" /> },
    ...(canManageUsers
      ? [{ id: 'users' as Tab, label: 'Users', icon: <Users className="h-4 w-4" /> }]
      : []),
    { id: 'preview', label: 'Live Preview', icon: <Eye className="h-4 w-4" /> },
    { id: 'export', label: draft.backendMode ? 'Publish / Export' : 'Export / Import', icon: <FileJson className="h-4 w-4" /> },
  ];

  if (!unlocked) {
    return (
      <AdminLogin
        onUnlock={() => {
          sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
          setUnlocked(true);
        }}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-ink-100 dark:border-ink-800 bg-white/85 dark:bg-ink-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo settings={draft.data} className="h-8 w-8" />
            <div>
              <p className="text-sm font-bold leading-tight">
                {draft.data?.appName ?? 'HelaMap'}{' '}
                <span className="rounded-md bg-blue-600/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                  Admin
                </span>
              </p>
              <p className="text-[11px] leading-tight text-ink-400">
                {draft.backendMode
                  ? `Backend Mode${user ? ` · ${user.name} (${user.role.replace('_', ' ')})` : ''}`
                  : draft.dirty
                    ? 'Static Mode · unsaved draft (auto-saved locally)'
                    : 'Static Mode · in sync with loaded data'}
              </p>
            </div>
          </Link>
          <div className="flex-1" />
          <ThemeToggle />
          <button
            type="button"
            className="btn-ghost !px-3"
            onClick={async () => {
              sessionStorage.removeItem(ADMIN_SESSION_KEY);
              if (backendEnabled()) await api.logout();
              setUnlocked(false);
            }}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Lock</span>
          </button>
        </div>

        {/* Tabs */}
        <nav
          className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Admin sections"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors',
                tab === t.id
                  ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900'
                  : 'text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800',
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Body */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {draft.loading || !draft.data ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-28" />
            ))}
          </div>
        ) : (
          <>
            {tab === 'dashboard' && (
              <AdminDashboard draft={draft} onNavigate={(t) => setTab(t as Tab)} />
            )}
            {tab === 'settings' && <SettingsEditor draft={draft} />}
            {tab === 'content' && <ContentEditor draft={draft} />}
            {tab === 'pages' && <PagesEditor draft={draft} />}
            {tab === 'users' && canManageUsers && <UsersManager />}
            {tab === 'preview' && (
              <div className="overflow-hidden rounded-2xl border border-ink-100 dark:border-ink-800 h-[calc(100vh-14rem)] min-h-[480px]">
                <MapExperience key={JSON.stringify(draft.data.lastUpdated)} data={draft.data} embedded />
              </div>
            )}
            {tab === 'export' && <ExportPanel draft={draft} />}
          </>
        )}
      </main>
    </div>
  );
}
