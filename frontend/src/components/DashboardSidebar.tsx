import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useAuthStore } from "../lib/auth-store";
import { apiClient } from "../lib/api-client";
import { Workspace } from "../pages/Dashboard";

interface SidebarProps {
  workspaces: Workspace[];
  activeWorkspace: string | null;
  onSelect: (slug: string | null) => void;
  onWorkspacesChange: () => void;
}

export default function DashboardSidebar({ workspaces, activeWorkspace, onSelect, onWorkspacesChange }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await apiClient.post("/workspaces", { name: newName.trim() });
      setNewName("");
      setDialogOpen(false);
      onWorkspacesChange();
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  return (
    <aside className="w-64 h-screen flex flex-col bg-[#181818] border-r border-surface-800/60 select-none shrink-0">
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-base font-bold text-surface-50" style={{ fontFamily: "var(--font-display)" }}>
            DrawDoc
          </span>
        </div>

        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[11px] font-semibold text-surface-500 uppercase tracking-[0.12em]">Workspaces</span>
          <span className="text-[11px] text-surface-600 font-mono">{workspaces.length}</span>
        </div>

        <nav className="space-y-0.5">
          <button
            onClick={() => onSelect(null)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
              activeWorkspace === null
                ? "bg-surface-800/60 text-surface-50"
                : "text-surface-400 hover:text-surface-200 hover:bg-surface-900"
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
            All Documents
          </button>

          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => onSelect(ws.slug)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group ${
                activeWorkspace === ws.slug
                  ? "bg-surface-800/60 text-surface-50"
                  : "text-surface-400 hover:text-surface-200 hover:bg-surface-900"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                activeWorkspace === ws.slug ? "bg-accent" : "bg-surface-600 group-hover:bg-surface-500"
              }`} />
              <span className="truncate">{ws.name}</span>
            </button>
          ))}

          <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
            <Dialog.Trigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-surface-500 hover:text-accent hover:bg-accent/5 transition-all duration-150 mt-1">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New Workspace
              </button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
              <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm rounded-2xl border border-surface-700 bg-surface-900 p-6 shadow-2xl">
                <Dialog.Title className="text-lg font-semibold text-surface-50 mb-1">
                  Create Workspace
                </Dialog.Title>
                <Dialog.Description className="text-sm text-surface-400 mb-5">
                  Give your workspace a name to get started.
                </Dialog.Description>

                <form
                  onSubmit={(e) => { e.preventDefault(); handleCreate(); }}
                  className="space-y-4"
                >
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Design Team"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-950 border border-surface-700 text-surface-50 text-sm placeholder:text-surface-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
                  />

                  <div className="flex justify-end gap-3">
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl text-sm font-medium text-surface-400 hover:text-surface-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </Dialog.Close>
                    <button
                      type="submit"
                      disabled={!newName.trim() || creating}
                      className="px-5 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-soft disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      {creating ? "Creating..." : "Create"}
                    </button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </nav>
      </div>

      <div className="mt-auto border-t border-surface-800/60 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center shrink-0">
            {user?.display_name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-surface-200 truncate">{user?.display_name || "User"}</p>
            <p className="text-[11px] text-surface-500 truncate">{user?.email || ""}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-surface-500 hover:text-surface-300 hover:bg-surface-800 transition-all"
            title="Sign out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
