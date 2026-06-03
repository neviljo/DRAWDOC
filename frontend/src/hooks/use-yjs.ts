import { useEffect, useRef, useCallback } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { useAuthStore } from "../lib/auth-store";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:1234";

export function useYjs(docId: string | undefined) {
  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!docId) return;

    const doc = new Y.Doc();
    docRef.current = doc;

    const token = sessionStorage.getItem("access_token") || "";
    const provider = new WebsocketProvider(WS_URL, docId, doc, {
      params: { token },
    });
    providerRef.current = provider;

    if (user) {
      provider.awareness.setLocalStateField("user", {
        id: user.id,
        name: user.display_name,
        color: getUserColor(user.id),
        avatarUrl: user.avatar_url,
      });
    }

    return () => {
      provider.destroy();
      doc.destroy();
      docRef.current = null;
      providerRef.current = null;
    };
  }, [docId, user?.id]);

  const getAwareness = useCallback(() => {
    return providerRef.current?.awareness;
  }, []);

  return {
    doc: docRef.current,
    provider: providerRef.current,
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
