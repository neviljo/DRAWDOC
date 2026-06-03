import { useState, useRef, useEffect } from "react";
import { useAgentChat } from "../hooks/use-chat";

interface AIPanelProps {
  docId: string;
  onClose: () => void;
}

const PROMPT_TEMPLATES = [
  "Draw a system architecture for this document",
  "Summarize this document",
  "Add a sequence diagram for the login flow",
  "Turn this bullet list into a flowchart",
];

function TimestampDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-surface-800" />
      <span className="text-xs text-surface-600">{label}</span>
      <div className="flex-1 h-px bg-surface-800" />
    </div>
  );
}

export default function AIPanel({ docId, onClose }: AIPanelProps) {
  const [input, setInput] = useState("");
  const [showTemplates, setShowTemplates] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, error, sendMessage, stop, clearHistory } = useAgentChat({ docId });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const msg = input;
    setInput("");
    setShowTemplates(false);
    sendMessage(msg);
  }

  return (
    <div className="w-80 border-l border-surface-800 bg-surface-950 flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-800">
        <span className="text-sm font-semibold">AI Assistant</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { if (confirm("Clear conversation history?")) clearHistory(); }}
            className="text-surface-500 hover:text-surface-300 text-xs"
            title="Clear history"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button onClick={onClose} className="text-surface-500 hover:text-surface-300 text-xs">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && showTemplates && (
          <div className="space-y-2">
            <p className="text-xs text-surface-500 mb-3">Try one of these:</p>
            {PROMPT_TEMPLATES.map((t) => (
              <button
                key={t}
                onClick={() => { setInput(t); setShowTemplates(false); }}
                className="w-full text-left p-3 rounded-xl bg-surface-900 border border-surface-800 text-sm text-surface-300 hover:bg-surface-800 hover:border-accent/30 transition-all"
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={m.id}>
            {i > 0 && messages[i - 1]?.createdAt && m.createdAt && (
              (() => {
                const diff = m.createdAt.getTime() - messages[i - 1].createdAt.getTime();
                return diff > 300000 ? <TimestampDivider label={formatTimeAgo(m.createdAt)} /> : null;
              })()
            )}
            <div className="flex gap-3">
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">
                  AI
                </div>
              )}
              <div className="flex-1 min-w-0">
                {m.role === "user" ? (
                  <div className="bg-accent/10 text-sm rounded-2xl rounded-tr-sm px-4 py-2.5 text-surface-200">
                    {m.content}
                  </div>
                ) : (
                  <div className="text-sm text-surface-300 leading-relaxed whitespace-pre-wrap">
                    {m.content}
                    {isLoading && i === messages.length - 1 && <span className="animate-pulse ml-1">▍</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-surface-500 text-xs">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
            Thinking
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error.message || "Something went wrong. Try again."}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-surface-800">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the AI..."
            className="flex-1 px-3 py-2 rounded-xl bg-surface-900 border border-surface-700 focus:border-accent outline-none text-sm placeholder-surface-600 transition-colors"
            disabled={isLoading}
          />
          {isLoading ? (
            <button type="button" onClick={stop} className="px-3 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors">
              Stop
            </button>
          ) : (
            <button type="submit" disabled={!input.trim()} className="px-3 py-2 rounded-xl bg-accent text-white text-sm hover:bg-accent-soft disabled:opacity-50 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}
