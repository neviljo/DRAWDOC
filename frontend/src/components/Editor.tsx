import { useCallback, useEffect, useRef, useState } from "react";
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

const MIN_PCT = 20;
const MAX_PCT = 60;

export default function Editor({ doc, provider, connectionStatus, viewMode }: EditorProps) {
  const [warming, setWarming] = useState(false);
  const [splitPct, setSplitPct] = useState(50);
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setWarming(true), 15000);
    return () => clearTimeout(t);
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;

    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.min(MAX_PCT, Math.max(MIN_PCT, pct)));
    };

    const onUp = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
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
    <div ref={containerRef} className="flex-1 h-full flex select-none" style={{ userSelect: dragging.current ? "none" : undefined }}>
      <div className="min-w-0 h-full" style={{ width: `${splitPct}%` }}>
        <ErrorBoundary>
          <BlockNoteEditor doc={doc} provider={provider} />
        </ErrorBoundary>
      </div>
      <div
        className="w-1.5 bg-surface-800 hover:bg-accent/50 active:bg-accent cursor-col-resize shrink-0 transition-colors relative"
        onMouseDown={onMouseDown}
      >
        <div className="absolute inset-0 -left-1 -right-1" />
      </div>
      <div className="min-w-0 h-full" style={{ width: `${100 - splitPct}%` }}>
        <ErrorBoundary>
          <ExcalidrawCanvas doc={doc} provider={provider} />
        </ErrorBoundary>
      </div>
    </div>
  );
}
