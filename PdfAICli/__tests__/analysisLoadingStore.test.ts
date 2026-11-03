import { useAnalysisLoadingStore } from '../src/store/useAnalysisLoadingStore';

describe('useAnalysisLoadingStore holdCount', () => {
    beforeEach(() => {
        useAnalysisLoadingStore.setState({
            loading: false,
            adUiLocked: false,
            lockEpoch: 0,
            holdCount: 0,
        });
    });

    it('acquire/release iç içe reklam+picker sayacı', () => {
        const s = useAnalysisLoadingStore.getState();
        s.acquireHold(); // watchAd
        expect(useAnalysisLoadingStore.getState().holdCount).toBe(1);
        s.acquireHold(); // rewardedAd
        expect(useAnalysisLoadingStore.getState().holdCount).toBe(2);
        s.releaseHold();
        expect(useAnalysisLoadingStore.getState().holdCount).toBe(1);
        s.releaseHold();
        expect(useAnalysisLoadingStore.getState().holdCount).toBe(0);
    });

    it('release holdCount 0 altına inmez', () => {
        useAnalysisLoadingStore.getState().releaseHold();
        expect(useAnalysisLoadingStore.getState().holdCount).toBe(0);
    });

    it('setHoldSession true/false PDF picker ile uyumlu', () => {
        useAnalysisLoadingStore.getState().setHoldSession(true);
        expect(useAnalysisLoadingStore.getState().holdCount).toBe(1);
        useAnalysisLoadingStore.getState().setHoldSession(false);
        expect(useAnalysisLoadingStore.getState().holdCount).toBe(0);
    });

    it('remountAdLock epoch artırır ve kilidi açık tutar', () => {
        useAnalysisLoadingStore.getState().setAdUiLocked(true);
        useAnalysisLoadingStore.getState().remountAdLock();
        const s = useAnalysisLoadingStore.getState();
        expect(s.adUiLocked).toBe(true);
        expect(s.lockEpoch).toBe(1);
    });
});
