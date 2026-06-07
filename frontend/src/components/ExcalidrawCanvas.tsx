import { useEffect, useRef, useCallback } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { Excalidraw, MainMenu } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";

interface Props {
  doc: Y.Doc;
  provider: WebsocketProvider;
}

const ELEMENTS_MAP_KEY = "excalidraw";

export default function ExcalidrawCanvas({ doc }: Props) {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const syncingRef = useRef(false);
  const onChangeReadyRef = useRef(false);

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

    const handleSync = () => {
      if (syncingRef.current) return;
      const elements = readElements();
      apiRef.current?.updateScene({ elements: elements as any });
    };

    map.observeDeep(handleSync);
    return () => map.unobserveDeep(handleSync);
  }, [doc]);

  const handleChange = useCallback(
    (elements: readonly any[], _state: any) => {
      if (!onChangeReadyRef.current) return;
      const map = doc.getMap(ELEMENTS_MAP_KEY);
      syncingRef.current = true;

      doc.transact(() => {
        const incoming = new Map(elements.map((el: any) => [el.id, el]));
        for (const [id, el] of incoming) {
          map.set(id, el);
        }
        for (const [id] of map) {
          if (!incoming.has(id)) {
            map.delete(id);
          }
        }
      });

      syncingRef.current = false;
    },
    [doc]
  );

  return (
    <div className="h-full w-full">
      <Excalidraw
        excalidrawAPI={(api) => {
          apiRef.current = api;
          loadInitialScene();
          requestAnimationFrame(() => {
            requestAnimationFrame(() => { onChangeReadyRef.current = true; });
          });
        }}
        onChange={handleChange}
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
