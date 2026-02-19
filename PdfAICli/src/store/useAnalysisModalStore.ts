import { create } from 'zustand';
import { ReactNode } from 'react';

type AnalysisModalState = {
    visible: boolean;
    title: string;
    content: ReactNode;
    onClose: () => void;
    open: (opts: {
        title: string;
        content: ReactNode;
        onClose: () => void;
    }) => void;
    close: () => void;
};

export const useAnalysisModalStore = create<AnalysisModalState>()((set) => ({
    visible: false,
    title: '',
    content: null,
    onClose: () => {},
    open: ({ title, content, onClose }) =>
        set({ visible: true, title, content, onClose }),
    close: () =>
        set((s) => {
            s.onClose();
            return { visible: false, title: '', content: null, onClose: () => {} };
        }),
}));
