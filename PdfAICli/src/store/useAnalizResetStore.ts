import { create } from 'zustand';

type AnalizResetState = {
    resetTrigger: number;
    requestAnalizReset: () => void;
};

export const useAnalizResetStore = create<AnalizResetState>()((set) => ({
    resetTrigger: 0,
    requestAnalizReset: () => set((s) => ({ resetTrigger: s.resetTrigger + 1 })),
}));
