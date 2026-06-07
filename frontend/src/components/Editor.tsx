import { useEffect, useState } from "react";
import type * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";
import type { ConnectionStatus } from "../hooks/use-yjs";
import type { ViewMode } from "../lib/view-mode-store";
import BlockNoteEditor from "./BlockNoteEditor";
import ExcalidrawCanvas from "./ExcalidrawCanvas";
import ErrorBoundary from "./ErrorBoundary";

interface EditorProps {
  doc: Y.Doc | null;
  provider: WebsocketProvider | null;
  connectionStatus: ConnectionStatus;
  viewMode: ViewMode;
}

export default function Editor({ doc, provider, connectionStatus, viewMode }: EditorProps) {
  const [warming, setWarming] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setWarming(true), 15000);
    return () => clearTimeout(t);
  }, []);

  const show = doc && provider && connectionStatus === "connected";

  if (!show) {
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
              : warming
                ? "Server is waking up — may take up to a minute"
                : "Connecting to document..."}
          </p>
        </div>
      </div>
    );
  }

  if (viewMode === "text") {
    return (
      <div className="flex-1 h-full">
        <ErrorBoundary>
          <BlockNoteEditor doc={doc} provider={provider} />
        </ErrorBoundary>
      </div>
    );
  }

  if (viewMode === "diagram") {
    return (
      <div className="flex-1 h-full">
        <ErrorBoundary>
          <ExcalidrawCanvas doc={doc} provider={provider} />
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex divide-x divide-surface-800">
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
