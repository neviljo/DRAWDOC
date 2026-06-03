import { create } from "zustand";

export type ViewMode = "split" | "text" | "diagram";

interface ViewModeState {
  mode: ViewMode;
  setMode: (m: ViewMode) => void;
  cycle: () => void;
}

export const useViewModeStore = create<ViewModeState>((set) => ({
  mode: "split",
  setMode: (mode) => set({ mode }),
  cycle: () =>
    set((s) => {
      const order: ViewMode[] = ["split", "text", "diagram"];
      const idx = order.indexOf(s.mode);
      return { mode: order[(idx + 1) % order.length] };
    }),
}));
