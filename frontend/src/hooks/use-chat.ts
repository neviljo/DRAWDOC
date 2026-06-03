import { useState, useRef, useCallback } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface UseChatOptions {
  docId: string;
  onFinish?: () => void;
}

export function useAgentChat({ docId, onFinish }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: new Date(),
    };

    const assistantId = crypto.randomUUID();
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);
    setError(undefined);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const token = sessionStorage.getItem("access_token");
      const baseUrl = import.meta.env.VITE_AGENT_URL || "http://localhost:8001";

      const response = await fetch(`${baseUrl}/agent/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          doc_id: docId,
          message: text,
          thread_id: docId,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Agent error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "text" && parsed.content) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: m.content + parsed.content } : m
                  )
                );
              } else if (parsed.type === "tool_start") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + `\n[${parsed.tool}]` }
                      : m
                  )
                );
              } else if (parsed.type === "done") {
                onFinish?.();
              }
            } catch {
              // partial JSON, skip
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err);
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [docId, onFinish]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setError(undefined);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    stop,
    clearHistory,
  };
}
