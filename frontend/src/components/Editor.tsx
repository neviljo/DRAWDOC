import { useEffect, useState } from "react";
import type * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";
import type { ConnectionStatus } from "../hooks/use-yjs";
import BlockNoteEditor from "./BlockNoteEditor";
import ExcalidrawCanvas from "./ExcalidrawCanvas";

interface EditorProps {
  doc: Y.Doc | null;
  provider: WebsocketProvider | null;
  connectionStatus: ConnectionStatus;
}

export default function Editor({ doc, provider, connectionStatus }: EditorProps) {
  const [minDone, setMinDone] = useState(false);
  const [forceShow, setForceShow] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setMinDone(true), 2000);
    const t2 = setTimeout(() => setForceShow(true), 15000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const show = (doc && provider && connectionStatus === "connected" && minDone)
            || (doc && provider && forceShow);

  return show ? (
    <div className="flex-1 flex divide-x divide-surface-800">
      <div className="flex-1 min-w-0">
        <BlockNoteEditor doc={doc} provider={provider} />
      </div>
      <div className="flex-1 min-w-0">
        <ExcalidrawCanvas doc={doc} provider={provider} />
      </div>
    </div>
  ) : (
    <div className="flex-1 flex items-center justify-center bg-surface-950">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-surface-700" />
          <div className="absolute inset-0 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-surface-400">
          {connectionStatus === "disconnected"
            ? "Reconnecting to document..."
            : "Connecting to document..."}
        </p>
      </div>
    </div>
  );
}
