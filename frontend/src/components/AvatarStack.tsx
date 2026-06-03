import { useEffect, useState } from "react";
import type { WebsocketProvider } from "y-websocket";

interface AwarenessUser {
  id: string;
  name: string;
  color: string;
  avatarUrl?: string;
}

interface Props {
  provider: WebsocketProvider | null;
}

export default function AvatarStack({ provider }: Props) {
  const [users, setUsers] = useState<AwarenessUser[]>([]);
  const [status, setStatus] = useState<"connected" | "reconnecting" | "offline">("connected");

  useEffect(() => {
    if (!provider) return;

    const awareness = provider.awareness;
    const update = () => {
      const states: AwarenessUser[] = [];
      awareness.getStates().forEach((state, _clientId) => {
        if (state.user) states.push(state.user);
      });
      setUsers(states.filter((u) => u.id));
    };

    awareness.on("change", update);
    update();

    provider.on("status", (event: { status: string }) => {
      if (event.status === "connected") setStatus("connected");
      else if (event.status === "connecting") setStatus("reconnecting");
      else setStatus("offline");
    });

    return () => {
      awareness.off("change", update);
    };
  }, [provider]);

  const visible = users.slice(0, 5);
  const overflow = users.length - visible.length;

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {visible.map((u) => (
          <div
            key={u.id}
            className="w-8 h-8 rounded-full border-2 border-surface-950 flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: u.color }}
            title={u.name}
          >
            {u.name.charAt(0).toUpperCase()}
          </div>
        ))}
        {overflow > 0 && (
          <div className="w-8 h-8 rounded-full border-2 border-surface-950 bg-surface-800 flex items-center justify-center text-xs text-surface-400">
            +{overflow}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-surface-500">
        <span
          className={`w-2 h-2 rounded-full ${
            status === "connected"
              ? "bg-green-400"
              : status === "reconnecting"
              ? "bg-yellow-400"
              : "bg-red-400"
          }`}
        />
        {status === "connected" ? "Live" : status === "reconnecting" ? "Reconnecting" : "Offline"}
      </div>
    </div>
  );
}
