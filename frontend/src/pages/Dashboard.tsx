import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../lib/auth-store";
import { apiClient } from "../lib/api-client";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

interface Document {
  id: string;
  title: string;
  view_mode: string;
  updated_at: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const ws = await apiClient.get<Workspace[]>("/workspaces");
        setWorkspaces(ws);
        if (ws.length > 0) {
          const recentDocs = await apiClient.get<Document[]>(`/workspaces/${ws[0].slug}/docs?sort=updated_at`);
          setDocs(recentDocs.slice(0, 5));
        }
      } catch {
        // not logged in or no data
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleCreateWorkspace() {
    const name = prompt("Workspace name:");
    if (!name) return;
    try {
      const ws = await apiClient.post<Workspace>("/workspaces", { name });
      setWorkspaces((prev) => [...prev, ws]);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleCreateDoc(wsSlug: string) {
    try {
      const doc = await apiClient.post<{ id: string; title: string }>(`/workspaces/${wsSlug}/docs`, { title: "Untitled" });
      navigate(`/doc/${doc.id}`);
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-surface-400 text-sm mt-1">Welcome back, {user?.display_name}</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleCreateWorkspace}
            className="px-4 py-2 rounded-xl border border-surface-700 text-sm font-medium hover:bg-surface-800 transition-colors"
          >
            New workspace
          </button>
          <button onClick={logout} className="text-sm text-surface-500 hover:text-surface-300">
            Sign out
          </button>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Recent documents</h2>
        {loading ? (
          <div className="rounded-2xl border border-surface-800 p-12 text-center text-surface-500">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-surface-800 rounded w-3/4 mx-auto" />
              <div className="h-4 bg-surface-800 rounded w-1/2 mx-auto" />
            </div>
          </div>
        ) : docs.length === 0 ? (
          <div className="rounded-2xl border border-surface-800 p-12 text-center text-surface-500">
            <p>No recent documents yet.</p>
            <p className="text-sm mt-1">Create a document to get started.</p>
            {workspaces.length > 0 && (
              <button onClick={() => handleCreateDoc(workspaces[0].slug)} className="mt-4 px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-soft transition-colors">
                Create your first document
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {docs.map((d) => (
              <div
                key={d.id}
                onClick={() => navigate(`/doc/${d.id}`)}
                className="flex items-center justify-between p-4 rounded-xl border border-surface-800 hover:bg-surface-900 cursor-pointer transition-colors"
              >
                <div>
                  <div className="font-medium text-sm">{d.title}</div>
                  <div className="text-xs text-surface-500 mt-0.5">{new Date(d.updated_at).toLocaleDateString()}</div>
                </div>
                <span className="text-xs text-surface-500">{d.view_mode}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Workspaces</h2>
        {loading ? (
          <div className="rounded-2xl border border-surface-800 p-12 text-center text-surface-500">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-surface-800 rounded w-3/4 mx-auto" />
              <div className="h-4 bg-surface-800 rounded w-1/2 mx-auto" />
            </div>
          </div>
        ) : workspaces.length === 0 ? (
          <div className="rounded-2xl border border-surface-800 p-12 text-center text-surface-500">
            <p>No workspaces yet.</p>
            <p className="text-sm mt-1">Create a workspace to invite your team.</p>
            <button onClick={handleCreateWorkspace} className="mt-4 px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-soft transition-colors">
              Create workspace
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className="flex items-center justify-between p-4 rounded-xl border border-surface-800 hover:bg-surface-900 transition-colors"
              >
                <div>
                  <div className="font-medium text-sm">{ws.name}</div>
                  <div className="text-xs text-surface-500 mt-0.5">{ws.slug}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCreateDoc(ws.slug)}
                    className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-soft transition-colors"
                  >
                    New doc
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
