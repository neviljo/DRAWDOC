import { useEffect } from "react";

interface Shortcuts {
  onToggleSidebar?: () => void;
  onCycleViewMode?: () => void;
  onToggleAIPanel?: () => void;
  onForceSave?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts(shortcuts: Shortcuts) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === "\\") {
        e.preventDefault();
        shortcuts.onToggleSidebar?.();
      }
      if (mod && e.shiftKey && e.key === "D") {
        e.preventDefault();
        shortcuts.onCycleViewMode?.();
      }
      if (mod && e.key === "k") {
        e.preventDefault();
        shortcuts.onToggleAIPanel?.();
      }
      if (mod && e.key === "s") {
        e.preventDefault();
        shortcuts.onForceSave?.();
      }
      if (e.key === "Escape") {
        shortcuts.onEscape?.();
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);
}
