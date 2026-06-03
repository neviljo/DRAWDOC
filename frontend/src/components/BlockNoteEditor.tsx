import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { useCreateBlockNote, BlockNoteViewRaw } from "@blocknote/react";
import "@blocknote/react/style.css";

interface Props {
  doc: Y.Doc;
  provider: WebsocketProvider;
}

export default function BlockNoteEditor({ doc, provider }: Props) {
  const editor = useCreateBlockNote({
    collaboration: {
      provider,
      fragment: doc.getXmlFragment("blocknote"),
      user: provider.awareness?.getLocalState()?.user || {
        name: "Anonymous",
        color: "#6366f1",
      },
    },
  });

  return (
    <div className="h-full overflow-y-auto p-6">
      <BlockNoteViewRaw editor={editor} theme="dark" />
    </div>
  );
}
