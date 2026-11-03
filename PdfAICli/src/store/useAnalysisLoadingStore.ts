import { create } from 'zustand';

type AnalysisLoadingState = {
    loading: boolean;
    /** Reklam yükleme / reklamlar arası UI kilidi (LoadingModal) */
    adUiLocked: boolean;
    /** Native reklam sonrası Modal yeniden mounts için */
    lockEpoch: number;
    /** >0 iken arka plan logout engellenir (PDF seçici, reklam vb.) */
    holdCount: number;
    setLoading: (value: boolean) => void;
    setAdUiLocked: (value: boolean) => void;
    /** Kilidi açık tutarak Modal'ı yeniden monte et (reklam arası) */
    remountAdLock: () => void;
    acquireHold: () => void;
    releaseHold: () => void;
    /** Geriye uyum: true → acquire, false → release */
    setHoldSession: (value: boolean) => void;
};

export const useAnalysisLoadingStore = create<AnalysisLoadingState>()(
    (set, get) => ({
        loading: false,
        adUiLocked: false,
        lockEpoch: 0,
        holdCount: 0,
        setLoading: value => set({ loading: value }),
        setAdUiLocked: value => set({ adUiLocked: value }),
        remountAdLock: () =>
            set(s => ({
                adUiLocked: true,
                lockEpoch: s.lockEpoch + 1,
            })),
        acquireHold: () => set(s => ({ holdCount: s.holdCount + 1 })),
        releaseHold: () =>
            set(s => ({ holdCount: Math.max(0, s.holdCount - 1) })),
        setHoldSession: value => {
            if (value) {
                get().acquireHold();
            } else {
                get().releaseHold();
            }
        },
    }),
);
