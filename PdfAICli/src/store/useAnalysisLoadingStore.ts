import { create } from 'zustand';

type AnalysisLoadingState = {
    loading: boolean;
    setLoading: (value: boolean) => void;
};

export const useAnalysisLoadingStore = create<AnalysisLoadingState>()((set) => ({
    loading: false,
    setLoading: (value) => set({ loading: value }),
}));
