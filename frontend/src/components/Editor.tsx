import { useEffect, useState } from "react";
import type * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";
import type { ConnectionStatus } from "../hooks/use-yjs";
import BlockNoteEditor from "./BlockNoteEditor";
import ExcalidrawCanvas from "./ExcalidrawCanvas";
import ErrorBoundary from "./ErrorBoundary";

interface EditorProps {
  doc: Y.Doc | null;
  provider: WebsocketProvider | null;
  connectionStatus: ConnectionStatus;
}

export default function Editor({ doc, provider, connectionStatus }: EditorProps) {
  const [phase, setPhase] = useState<"loading" | "warming" | "show">("loading");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("warming"), 5000);
    const t2 = setTimeout(() => setPhase("show"), 10000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (doc && provider && connectionStatus === "connected") setPhase("show");
  }, [doc, provider, connectionStatus]);

  if (phase === "show" && doc && provider) {
    return (
      <div className="flex-1 flex divide-x divide-surface-800">
        <div className="flex-1 min-w-0">
          <ErrorBoundary>
            <BlockNoteEditor doc={doc} provider={provider} />
          </ErrorBoundary>
        </div>
        <div className="flex-1 min-w-0">
          <ErrorBoundary>
            <ExcalidrawCanvas doc={doc} provider={provider} />
          </ErrorBoundary>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-surface-950">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-surface-700" />
          <div className="absolute inset-0 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-surface-400">
          {connectionStatus === "disconnected"
            ? "Reconnecting..."
            : phase === "warming"
              ? "Server is waking up — may take up to a minute"
              : "Connecting to document..."}
        </p>
      </div>
    </div>
  );
}
