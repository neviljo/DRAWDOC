import { useEffect, useState } from "react";
import { useAuthStore } from "../lib/auth-store";
import { getGuestIdentity } from "../lib/guest-identity";
import { useYjs } from "../hooks/use-yjs";
import BlockNoteEditor from "./BlockNoteEditor";
import ExcalidrawCanvas from "./ExcalidrawCanvas";

const DEMO_DOC_ID = "demo-workspace-doc";

export default function DemoEditor() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [collaboratorCount, setCollaboratorCount] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  const { doc, provider } = useYjs(DEMO_DOC_ID);

  useEffect(() => {
    if (!isAuthenticated) {
      getGuestIdentity();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!provider) return;
    const awareness = provider.awareness;
    const updateCount = () => {
      setCollaboratorCount(awareness.getStates().size);
    };
    awareness.on("change", updateCount);
    updateCount();
    return () => awareness.off("change", updateCount);
  }, [provider]);

  async function handleReset() {
    try {
      await fetch(`/api/demo/reset`, { method: "POST" });
      setResetKey((k) => k + 1);
      window.location.reload();
    } catch {
      // ignore
    }
  }

  if (!doc || !provider) {
    return (
      <div className="flex items-center justify-center h-full text-surface-500 text-sm">
        Connecting to demo...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-surface-800 overflow-hidden bg-surface-950 shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 bg-surface-900 border-b border-surface-800">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-xs text-surface-500 ml-3">demo.drawdoc.app</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-surface-500">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {collaboratorCount} editing
          </div>
          <button
            onClick={handleReset}
            className="px-3 py-1 rounded-lg text-xs text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="flex" style={{ height: "500px" }}>
        <div className="flex-1 min-w-0 border-r border-surface-800 overflow-hidden">
          <BlockNoteEditor key={`bn-${resetKey}`} doc={doc} provider={provider} />
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <ExcalidrawCanvas key={`ex-${resetKey}`} doc={doc} provider={provider} />
        </div>
      </div>

      {!isAuthenticated && (
        <div className="border-t border-surface-800 p-3 bg-surface-900 text-center">
          <a
            href="/signup"
            className="text-sm text-accent hover:underline font-medium"
          >
            Sign up free to unlock AI diagram generation →
          </a>
        </div>
      )}
    </div>
  );
}
