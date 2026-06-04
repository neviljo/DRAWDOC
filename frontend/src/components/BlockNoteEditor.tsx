import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { useCreateBlockNote, BlockNoteViewRaw } from "@blocknote/react";
import "@blocknote/react/style.css";

const blockNoteStyles = `
  .bn-container {
    height: 100% !important;
  }
  .bn-editor {
    height: 100% !important;
    min-height: 0 !important;
  }
`;

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
    <div className="h-full p-6" style={{ minHeight: 0 }}>
      <style>{blockNoteStyles}</style>
      <BlockNoteViewRaw editor={editor} theme="dark" />
    </div>
  );
}
