import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import Editor from "../components/Editor";
import AIPanel from "../components/AIPanel";
import AvatarStack from "../components/AvatarStack";
import ThemeToggle from "../components/ThemeToggle";
import { useYjs } from "../hooks/use-yjs";
import { useViewModeStore } from "../lib/view-mode-store";
import { useKeyboardShortcuts } from "../hooks/use-keyboard-shortcuts";

export default function DocumentPage() {
  const { docId } = useParams<{ docId: string }>();
  const { doc, provider, connectionStatus } = useYjs(docId);
  const { mode, cycle } = useViewModeStore();
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleAIPanel = useCallback(() => setAiPanelOpen((v) => !v), []);

  useKeyboardShortcuts({
    onToggleSidebar: () => setSidebarOpen((v) => !v),
    onCycleViewMode: cycle,
    onToggleAIPanel: toggleAIPanel,
    onForceSave: () => {},
    onEscape: () => {
      setAiPanelOpen(false);
    },
  });

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-2 border-b border-surface-800 bg-surface-950">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-surface-800 text-surface-400"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-white font-bold text-xs">
            D
          </div>
          <input
            type="text"
            defaultValue="Untitled"
            className="bg-transparent border-none outline-none text-sm font-medium text-surface-200 placeholder-surface-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => cycle()}
            className="px-3 py-1.5 rounded-lg text-xs text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-colors"
            title="Cycle view mode (Cmd+Shift+D)"
          >
            {mode === "split" ? "Split" : mode === "text" ? "Text" : "Diagram"}
          </button>

          <ThemeToggle />
          <AvatarStack provider={provider} />

          <button
            onClick={toggleAIPanel}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              aiPanelOpen
                ? "bg-accent text-white"
                : "text-surface-400 hover:text-surface-200 hover:bg-surface-800"
            }`}
          >
            AI
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {sidebarOpen && (
          <aside className="w-60 border-r border-surface-800 bg-surface-950 p-4 flex-shrink-0">
            <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">
              Documents
            </div>
            <div className="text-sm text-surface-500 text-center py-8">No documents yet</div>
          </aside>
        )}

        <div className={`flex-1 flex overflow-hidden ${mode === "diagram" ? "" : ""}`}>
          {docId ? (
            <>
              {mode !== "diagram" && (
                <div className={mode === "text" ? "flex-1" : "flex-1 border-r border-surface-800"}>
                  <Editor doc={doc} provider={provider} connectionStatus={connectionStatus} />
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-surface-500">
              No document selected
            </div>
          )}
        </div>

        {aiPanelOpen && docId && (
          <AIPanel docId={docId} onClose={() => setAiPanelOpen(false)} />
        )}
      </div>
    </div>
  );
}
