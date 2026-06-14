import { useEffect, useRef, useCallback, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { useAuthStore } from "../lib/auth-store";
import { getGuestIdentity } from "../lib/guest-identity";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:1234";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export function useYjs(docId: string | undefined) {
  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const user = useAuthStore((s) => s.user);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");

  useEffect(() => {
    if (!docId) {
      console.log("[useYjs effect] docId falsy, skipping", docId);
      return;
    }

    console.log("[useYjs effect] START docId:", docId);
    const doc = new Y.Doc();
    docRef.current = doc;

    const token = sessionStorage.getItem("access_token") || "";
    const provider = new WebsocketProvider(WS_URL, docId, doc, {
      params: { token },
      maxBackoffTime: 1000,
    });
    providerRef.current = provider;

    setConnectionStatus("connecting");

    const onStatus = (event: { status: string }) => {
      console.log("[useYjs] status:", event.status, "docId:", docId);
      if (event.status === "connected") setConnectionStatus("connected");
      else if (event.status === "connecting") setConnectionStatus("connecting");
      else setConnectionStatus("disconnected");
    };
    provider.on("status", onStatus);

    const guest = getGuestIdentity();
    provider.awareness.setLocalStateField("user", {
      id: user?.id || guest.id,
      name: user?.display_name || guest.name,
      color: user ? getUserColor(user.id) : guest.color,
      avatarUrl: user?.avatar_url || null,
    });

    // Periodic heartbeat to keep WebSocket alive through Render's proxy
    // y-websocket forces reconnect after 30s of no received messages.
    // Since awareness is send-only, we must also reset _lastMessageReceived
    // to prevent unnecessary forced reconnection every 30s.
    const keepalive = setInterval(() => {
      provider.awareness.setLocalStateField("_ping", Date.now());
      try {
        if (typeof (provider as any).wsLastMessageReceived === "number") {
          (provider as any).wsLastMessageReceived =
            (provider as any).wsLastMessageReceived > 1000000000000
              ? Date.now()
              : Math.floor(Date.now() / 1000);
        }
      } catch { /* provider may be destroyed */ }
    }, 20000);

    console.log("[useYjs effect] END refs set docId:", docId);

    return () => {
      console.log("[useYjs cleanup] docId:", docId);
      clearInterval(keepalive);
      provider.off("status", onStatus);
      provider.destroy();
      doc.destroy();
      docRef.current = null;
      providerRef.current = null;
    };
  }, [docId, user?.id]);

  const getAwareness = useCallback(() => {
    return providerRef.current?.awareness;
  }, []);

  const outDoc = docRef.current;
  const outProvider = providerRef.current;
  console.log("[useYjs render] docId:", docId, "doc:", !!outDoc, "prov:", !!outProvider, "status:", connectionStatus);

  return {
    doc: outDoc,
    provider: outProvider,
    connectionStatus,
    getAwareness,
  };
}

const COLORS = [
  "#6366f1", "#3b82f6", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#06b6d4", "#84cc16",
  "#a855f7", "#f97316", "#22d3ee", "#22c55e",
];

function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % COLORS.length;
  return COLORS[idx];
}
