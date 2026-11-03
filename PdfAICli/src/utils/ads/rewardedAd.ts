/**
 * Rewarded ads – native modül yoksa asla require etme (TurboModule crash önlenir).
 */
import { NativeModules, Platform } from 'react-native';
import { reportAdReward, type AdsRewardResponse } from '../../server/api/Lab';
import { TEST_REWARDED_UNIT_ID } from '../../constants/limits';
import { useAnalysisLoadingStore } from '../../store/useAnalysisLoadingStore';
import { useSessionStore } from '../../store/useSessionStore';

type AdsModule = typeof import('react-native-google-mobile-ads');

let adsSdkReady: Promise<void> | null = null;

function hasNativeAdsModule(): boolean {
    const mods = NativeModules as Record<string, unknown>;
    return !!(
        mods.RNGoogleMobileAdsModule ||
        mods.RNGoogleMobileAds ||
        mods.GoogleMobileAdsModule
    );
}

function loadAdsModule(): AdsModule | null {
    // getEnforcing crash olmasın diye önce soft check
    if (!hasNativeAdsModule()) {
        if (__DEV__) {
            console.warn('AdMob native module missing – ads disabled');
        }
        return null;
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        return require('react-native-google-mobile-ads') as AdsModule;
    } catch (err) {
        if (__DEV__) {
            console.warn('AdMob JS module load failed', err);
        }
        return null;
    }
}

async function ensureAdsInitialized(ads: AdsModule): Promise<void> {
    if (!adsSdkReady) {
        adsSdkReady = ads
            .default()
            .initialize()
            .then(() => undefined)
            .catch(err => {
                adsSdkReady = null;
                throw err;
            });
    }
    await adsSdkReady;
}

/** 2 izleme → sunucu +1 hak. Native yoksa null (uygulama açık kalır). */
export function showRewardedAdForCredit(
    unitId: string,
): Promise<AdsRewardResponse | null> {
    return new Promise(async resolve => {
        // Reklam full-screen app'i background'a atar → oturumu tut
        useAnalysisLoadingStore.getState().acquireHold();
        useSessionStore.getState().touch();

        const releaseSession = () => {
            useSessionStore.getState().touch();
            useAnalysisLoadingStore.getState().releaseHold();
        };

        const ads = loadAdsModule();
        if (!ads?.RewardedAd || !ads.RewardedAdEventType || !ads.AdEventType) {
            releaseSession();
            resolve(null);
            return;
        }

        const { AdEventType, RewardedAd, RewardedAdEventType } = ads;
        const adUnit = (unitId || '').trim() || TEST_REWARDED_UNIT_ID;

        try {
            await ensureAdsInitialized(ads);
        } catch (err) {
            if (__DEV__) {
                console.warn('AdMob init failed', err);
            }
            releaseSession();
            resolve(null);
            return;
        }

        let settled = false;
        let earned = false;
        let rewarded: ReturnType<typeof RewardedAd.createForAdRequest>;

        try {
            rewarded = RewardedAd.createForAdRequest(adUnit, {
                requestNonPersonalizedAdsOnly: Platform.OS === 'ios',
            });
        } catch (err) {
            if (__DEV__) {
                console.warn('AdMob create failed', err);
            }
            releaseSession();
            resolve(null);
            return;
        }

        const finish = async (ok: boolean) => {
            if (settled) {
                return;
            }
            settled = true;
            unsub();
            if (!ok || !earned) {
                releaseSession();
                resolve(null);
                return;
            }
            try {
                resolve(await reportAdReward());
            } catch (e) {
                if (__DEV__) {
                    console.warn('reportAdReward failed', e);
                }
                resolve(null);
            } finally {
                releaseSession();
            }
        };

        const unsubLoaded = rewarded.addAdEventListener(
            RewardedAdEventType.LOADED,
            () => {
                rewarded.show().catch(() => finish(false));
            },
        );
        const unsubEarned = rewarded.addAdEventListener(
            RewardedAdEventType.EARNED_REWARD,
            () => {
                earned = true;
            },
        );
        const unsubClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
            finish(earned);
        });
        const unsubError = rewarded.addAdEventListener(AdEventType.ERROR, () => {
            finish(false);
        });

        const unsub = () => {
            unsubLoaded();
            unsubEarned();
            unsubClosed();
            unsubError();
        };

        try {
            rewarded.load();
        } catch {
            finish(false);
        }
    });
}
