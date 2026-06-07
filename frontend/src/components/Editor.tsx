import { useEffect, useState } from "react";
import type * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";
import type { ConnectionStatus } from "../hooks/use-yjs";

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
    console.log("[Editor] deps changed", { phase, doc: !!doc, prov: !!provider, status: connectionStatus });
    if (doc && provider && connectionStatus === "connected") setPhase("show");
  }, [doc, provider, connectionStatus]);

  const show = phase === "show" && doc && provider;
  console.log("[Editor] render", { show, phase, doc: !!doc, prov: !!provider, status: connectionStatus });

  return (
    <div className="flex-1 flex items-center justify-center bg-red-500">
      <div className="text-center text-white p-8">
        <p className="text-2xl font-bold">EDITOR MOUNTED</p>
        <p className="text-sm mt-2">show: {String(show)} phase: {phase} doc: {String(!!doc)} prov: {String(!!provider)} status: {connectionStatus}</p>
      </div>
    </div>
  );
}
