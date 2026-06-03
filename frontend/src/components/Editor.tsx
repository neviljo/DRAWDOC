import { useYjs } from "../hooks/use-yjs";
import BlockNoteEditor from "./BlockNoteEditor";
import ExcalidrawCanvas from "./ExcalidrawCanvas";

interface EditorProps {
  docId: string;
}

export default function Editor({ docId }: EditorProps) {
  const { doc, provider } = useYjs(docId);

  if (!doc || !provider) {
    return (
      <div className="flex-1 flex items-center justify-center text-surface-500">
        Connecting to document...
      </div>
    );
  }

  return (
    <div className="flex-1 flex divide-x divide-surface-800">
      <div className="flex-1 min-w-0">
        <BlockNoteEditor doc={doc} provider={provider} />
      </div>
      <div className="flex-1 min-w-0">
        <ExcalidrawCanvas doc={doc} provider={provider} />
      </div>
    </div>
  );
}
