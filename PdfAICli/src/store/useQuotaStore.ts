import { create } from 'zustand';
import { getAdsStatus, type AdsStatusResponse } from '../server/api/Lab';

type QuotaState = {
    remaining: number | null;
    limitDisabled: boolean;
    baseLimit: number;
    loaded: boolean;
    refresh: () => Promise<void>;
};

export const useQuotaStore = create<QuotaState>()((set) => ({
    remaining: null,
    limitDisabled: false,
    baseLimit: 1,
    loaded: false,
    refresh: async () => {
        try {
            const data: AdsStatusResponse = await getAdsStatus();
            set({
                remaining:
                    typeof data.remaining === 'number' ? data.remaining : null,
                limitDisabled: data.limitDisabled === true,
                baseLimit:
                    typeof data.baseLimit === 'number' ? data.baseLimit : 1,
                loaded: true,
            });
        } catch {
            /* sessiz */
        }
    },
}));
