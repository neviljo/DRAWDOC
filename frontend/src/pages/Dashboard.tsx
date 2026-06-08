import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../lib/auth-store";
import { apiClient } from "../lib/api-client";
import DashboardSidebar from "../components/DashboardSidebar";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

interface Document {
  id: string;
  title: string;
  workspace_id?: string;
  view_mode: string;
  is_public?: boolean;
  updated_at: string;
  created_at: string;
}

function timeAgo(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [allDocs, setAllDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const ws = await apiClient.get<Workspace[]>("/workspaces");
      setWorkspaces(ws);
      if (ws.length > 0) {
        const docsResults = await Promise.all(
          ws.map((w) =>
            apiClient.get<Document[]>(`/workspaces/${w.slug}/docs?sort=updated_at`).catch(() => [] as Document[])
          )
        );
        const flat = docsResults.flat().sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        setAllDocs(flat);
      } else {
        setAllDocs([]);
      }
    } catch {
      setAllDocs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const workspaceMap = useMemo(() => {
    const map = new Map<string, Workspace>();
    for (const ws of workspaces) {
      map.set(ws.slug, ws);
    }
    return map;
  }, [workspaces]);

  const filteredDocs = useMemo(() => {
    let docs = allDocs;
    if (activeWorkspace) {
      docs = docs.filter((d) => {
        const ws = workspaceMap.get(activeWorkspace);
        return ws && d.workspace_id === ws.id;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      docs = docs.filter((d) => d.title.toLowerCase().includes(q));
    }
    return docs;
  }, [allDocs, activeWorkspace, search, workspaceMap]);

  async function handleCreateDoc(viewMode?: string) {
    const target = activeWorkspace || workspaces[0]?.slug;
    if (!target || !workspaces.length) return;
    setCreating(target);
    try {
      const doc = await apiClient.post<{ id: string }>(`/workspaces/${target}/docs`, {
        title: "Untitled",
        ...(viewMode ? { view_mode: viewMode } : {}),
      });
      navigate(`/doc/${doc.id}`);
    } catch {
      // ignore
    } finally {
      setCreating(null);
    }
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="flex h-screen bg-surface-950 text-surface-50">
      <DashboardSidebar
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        onSelect={setActiveWorkspace}
        onWorkspacesChange={loadData}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="shrink-0 flex items-center justify-between px-8 py-4 border-b border-surface-800/40 bg-surface-950/80 backdrop-blur-sm">
          <div>
            <h1 className="text-lg font-semibold text-surface-50" style={{ fontFamily: "var(--font-display)" }}>
              {greeting}, {user?.display_name?.split(" ")[0] || "there"}
            </h1>
            <p className="text-sm text-surface-500 mt-0.5">
              {activeWorkspace
                ? `Browsing ${workspaceMap.get(activeWorkspace)?.name || activeWorkspace}`
                : `${allDocs.length} document${allDocs.length !== 1 ? "s" : ""} across ${workspaces.length} workspace${workspaces.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="w-56 pl-9 pr-3 py-2 rounded-xl bg-surface-900 border border-surface-700/60 text-sm text-surface-200 placeholder:text-surface-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>

            <div className="w-8 h-8 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center">
              {user?.display_name ? getInitials(user.display_name) : "?"}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-8 py-8 space-y-10">
            {!loading && workspaces.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-surface-400 uppercase tracking-[0.08em] mb-4">Quick Create</h2>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => handleCreateDoc()}
                    disabled={creating !== null}
                    className="group relative overflow-hidden rounded-2xl border border-surface-800/60 bg-surface-900/50 p-6 hover:border-surface-700 hover:bg-surface-900 transition-all duration-200 disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-xl bg-surface-800 flex items-center justify-center mb-4 group-hover:bg-accent/10 group-hover:text-accent transition-all">
                      <svg className="w-5 h-5 text-surface-400 group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-surface-200 group-hover:text-surface-50 transition-colors">Blank Document</h3>
                    <p className="text-xs text-surface-500 mt-1">Start from scratch with a blank canvas</p>
                  </button>

                  <button
                    onClick={() => handleCreateDoc("diagram")}
                    disabled={creating !== null}
                    className="group relative overflow-hidden rounded-2xl border border-surface-800/60 bg-surface-900/50 p-6 hover:border-surface-700 hover:bg-surface-900 transition-all duration-200 disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-all">
                      <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-surface-200 group-hover:text-surface-50 transition-colors">AI Diagram</h3>
                    <p className="text-xs text-surface-500 mt-1">Generate diagrams with AI</p>
                  </button>

                  <button
                    onClick={() => handleCreateDoc("text")}
                    disabled={creating !== null}
                    className="group relative overflow-hidden rounded-2xl border border-surface-800/60 bg-surface-900/50 p-6 hover:border-surface-700 hover:bg-surface-900 transition-all duration-200 disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-all">
                      <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-surface-200 group-hover:text-surface-50 transition-colors">AI Document</h3>
                    <p className="text-xs text-surface-500 mt-1">Generate documents with AI</p>
                  </button>
                </div>
              </section>
            )}

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-surface-400 uppercase tracking-[0.08em]">
                  {search ? "Search Results" : activeWorkspace ? "Documents" : "Recent Documents"}
                </h2>
                <span className="text-xs text-surface-600 font-mono">
                  {filteredDocs.length} doc{filteredDocs.length !== 1 ? "s" : ""}
                </span>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 rounded-xl bg-surface-900/50 animate-pulse" />
                  ))}
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-surface-800/60 p-12 text-center">
                  <div className="w-12 h-12 rounded-xl bg-surface-800/50 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-surface-400">
                    {search ? "No documents match your search" : "No documents yet"}
                  </p>
                  <p className="text-xs text-surface-600 mt-1">
                    {search ? "Try a different search term" : "Create your first document to get started"}
                  </p>
                  {!search && workspaces.length > 0 && (
                    <button
                      onClick={() => handleCreateDoc()}
                      className="mt-5 px-5 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-soft transition-colors"
                    >
                      Create Document
                    </button>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-surface-800/40 overflow-hidden">
                  <div className="grid grid-cols-[1fr_180px_120px_100px] gap-0 text-[11px] font-semibold text-surface-500 uppercase tracking-[0.08em] px-5 py-3 bg-surface-900/30 border-b border-surface-800/40">
                    <span>Name</span>
                    <span>Workspace</span>
                    <span>Edited</span>
                    <span className="text-right">Mode</span>
                  </div>
                  <div className="divide-y divide-surface-800/30">
                    {filteredDocs.map((doc) => {
                      const ws = workspaces.find((w) => w.id === doc.workspace_id);
                      return (
                        <div
                          key={doc.id}
                          onClick={() => navigate(`/doc/${doc.id}`)}
                          className="grid grid-cols-[1fr_180px_120px_100px] gap-0 px-5 py-3.5 text-sm hover:bg-surface-900/60 cursor-pointer transition-colors group items-center"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <svg className="w-4 h-4 shrink-0 text-surface-600 group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            <span className="font-medium text-surface-200 truncate group-hover:text-surface-50 transition-colors">
                              {doc.title}
                            </span>
                          </div>
                          <span className="text-surface-500 text-xs truncate">{ws?.name || "—"}</span>
                          <span className="text-surface-500 text-xs">{timeAgo(doc.updated_at)}</span>
                          <span className="text-right">
                            <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              doc.view_mode === "diagram"
                                ? "bg-amber-500/10 text-amber-400"
                                : doc.view_mode === "text"
                                ? "bg-sky-500/10 text-sky-400"
                                : "bg-surface-800 text-surface-500"
                            }`}>
                              {doc.view_mode === "split" ? "Both" : doc.view_mode}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
