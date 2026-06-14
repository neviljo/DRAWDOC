import { useEffect, useRef, useCallback } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { Excalidraw, MainMenu } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { Collaborator } from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";

interface Props {
  doc: Y.Doc;
  provider: WebsocketProvider;
}

const ELEMENTS_MAP_KEY = "excalidraw";
const LOCAL_ORIGIN = Symbol("excalidraw-local");

export default function ExcalidrawCanvas({ doc, provider }: Props) {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const syncingRef = useRef(false);
  const onChangeReadyRef = useRef(false);
  const collaboratorMapRef = useRef<Map<string, Collaborator>>(new Map());
  const applyingRemoteUpdateRef = useRef(false);

  function readElements() {
    const map = doc.getMap(ELEMENTS_MAP_KEY);
    return Array.from(map.values()).map((el: any) =>
      typeof el?.toJSON === "function" ? el.toJSON() : el
    );
  }

  function loadInitialScene() {
    const api = apiRef.current;
    if (!api) return;
    const elements = readElements();
    if (elements.length > 0) {
      api.updateScene({ elements: elements as any });
    }
  }

  useEffect(() => {
    const map = doc.getMap(ELEMENTS_MAP_KEY);

    const handleSync = (_events: any, transaction: any) => {
      if (syncingRef.current) return;
      if (transaction.origin === LOCAL_ORIGIN) return;
      const elements = readElements();
      
      applyingRemoteUpdateRef.current = true;
      apiRef.current?.updateScene({ elements: elements as any });
      applyingRemoteUpdateRef.current = false;
    };

    map.observeDeep(handleSync);
    return () => map.unobserveDeep(handleSync);
  }, [doc]);

  useEffect(() => {
    const awareness = provider.awareness;

    const updateCollaborators = () => {
      const api = apiRef.current;
      if (!api) return;

      const map = new Map<string, Collaborator>();
      const states = awareness.getStates();

      states.forEach((state: any, clientId: number) => {
        const user = state.user;
        if (!user) return;

        const pointer = state.pointer || { x: 0, y: 0, tool: "pointer" };
        const button = state.button || "up";

        map.set(clientId.toString(), {
          id: user.id,
          username: user.name,
          color: {
            background: user.color,
            stroke: user.color,
          },
          avatarUrl: user.avatarUrl || null,
          pointer: { x: pointer.x, y: pointer.y, tool: "pointer" },
          button,
        });
      });

      collaboratorMapRef.current = map;
      api.updateScene({ collaborators: map as any });
    };

    awareness.on("change", updateCollaborators);
    updateCollaborators();

    return () => {
      awareness.off("change", updateCollaborators);
    };
  }, [provider]);

  const handleChange = useCallback(
    (elements: readonly any[], _state: any) => {
      if (!onChangeReadyRef.current) return;
      if (applyingRemoteUpdateRef.current) return;

      const map = doc.getMap(ELEMENTS_MAP_KEY);

      // Verify if there are any actual changes before writing to Yjs doc
      let hasChanges = false;
      const incoming = new Map(elements.map((el: any) => [el.id, el]));
      for (const [id, el] of incoming) {
        const existing = map.get(id) as any;
        if (!existing || existing.version !== el.version) {
          hasChanges = true;
          break;
        }
      }
      if (!hasChanges) {
        for (const [id] of map) {
          if (!incoming.has(id)) {
            hasChanges = true;
            break;
          }
        }
      }

      if (!hasChanges) return;

      syncingRef.current = true;
      doc.transact(() => {
        for (const [id, el] of incoming) {
          const existing = map.get(id) as any;
          if (!existing || existing.version !== el.version) {
            map.set(id, el);
          }
        }
        for (const [id] of map) {
          if (!incoming.has(id)) {
            map.delete(id);
          }
        }
      }, LOCAL_ORIGIN);

      syncingRef.current = false;
    },
    [doc]
  );

  const handlePointerUpdate = useCallback(
    (payload: { pointer: { x: number; y: number; tool: string }; button: "up" | "down" }) => {
      provider.awareness.setLocalStateField("pointer", payload.pointer);
      provider.awareness.setLocalStateField("button", payload.button);
    },
    [provider]
  );

  return (
    <div className="h-full w-full">
      <Excalidraw
        excalidrawAPI={(api) => {
          apiRef.current = api;
          loadInitialScene();
          const collabMap = collaboratorMapRef.current;
          if (collabMap.size > 0) {
            api.updateScene({ collaborators: collabMap as any });
          }
          requestAnimationFrame(() => {
            requestAnimationFrame(() => { onChangeReadyRef.current = true; });
          });
        }}
        onChange={handleChange}
        onPointerUpdate={handlePointerUpdate}
        theme="dark"
        UIOptions={{
          canvasActions: {
            toggleTheme: true,
          },
        }}
      >
        <MainMenu>
          <MainMenu.DefaultItems.ToggleTheme />
          <MainMenu.DefaultItems.Export />
          <MainMenu.DefaultItems.ClearCanvas />
        </MainMenu>
      </Excalidraw>
    </div>
  );
}
