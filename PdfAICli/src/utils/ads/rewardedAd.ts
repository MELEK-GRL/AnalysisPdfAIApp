/**
 * Rewarded ads – native modül yoksa crash etmeden null dön.
 */
import {
    NativeModules,
    Platform,
    TurboModuleRegistry,
} from 'react-native';
import { reportAdReward, type AdsRewardResponse } from '../../server/api/Lab';
import { TEST_REWARDED_UNIT_ID } from '../../constants/limits';
import { useAnalysisLoadingStore } from '../../store/useAnalysisLoadingStore';
import { useSessionStore } from '../../store/useSessionStore';

type AdsModule = typeof import('react-native-google-mobile-ads');

export type RewardedAdShowResult = {
    /** Kullanıcı ödülü kazandı (reklamı tamamladı) */
    watched: boolean;
    /** Sunucu raporu (report:true iken); başarısızsa null */
    reward: AdsRewardResponse | null;
};

let adsSdkReady: Promise<void> | null = null;

const LOAD_TIMEOUT_MS = 45_000;

function hasNativeAdsModule(): boolean {
    try {
        if (TurboModuleRegistry.get('RNGoogleMobileAdsModule') != null) {
            return true;
        }
    } catch {
        /* ignore */
    }
    const mods = NativeModules as Record<string, unknown>;
    return !!(
        mods.RNGoogleMobileAdsModule ||
        mods.RNGoogleMobileAdsRewardedModule ||
        mods.RNGoogleMobileAds ||
        mods.GoogleMobileAdsModule
    );
}

function loadAdsModule(): AdsModule | null {
    if (!hasNativeAdsModule()) {
        if (__DEV__) {
            console.warn(
                'AdMob native module missing (TurboModule/NativeModules) – ads disabled',
            );
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

type ShowOptions = {
    /**
     * true: izleme sonrası /ads/reward → analiz hakkı.
     * Varsayılan false (karşılaştırma vs. kilit açma analiz hakkı vermez).
     */
    report?: boolean;
};

/**
 * 1 rewarded reklam gösterir.
 * LoadingModal show öncesi kapatılır (RN Modal native AdMob'u engeller).
 */
export function showRewardedAd(
    unitId: string,
    options: ShowOptions = {},
): Promise<RewardedAdShowResult> {
    const report = options.report === true;

    return new Promise(async resolve => {
        useAnalysisLoadingStore.getState().acquireHold();
        useSessionStore.getState().touch();

        const releaseSession = () => {
            useSessionStore.getState().touch();
            useAnalysisLoadingStore.getState().releaseHold();
        };

        const done = (watched: boolean, reward: AdsRewardResponse | null) => {
            releaseSession();
            resolve({ watched, reward });
        };

        const ads = loadAdsModule();
        if (!ads?.RewardedAd || !ads.RewardedAdEventType || !ads.AdEventType) {
            if (__DEV__) {
                console.warn('AdMob RewardedAd API unavailable');
            }
            done(false, null);
            return;
        }

        const { AdEventType, RewardedAd, RewardedAdEventType } = ads;
        // Paket TestIds varsa onu tercih et (Google resmi test unit)
        const testId =
            (ads as AdsModule & { TestIds?: { REWARDED?: string } }).TestIds
                ?.REWARDED || TEST_REWARDED_UNIT_ID;
        const adUnit = (unitId || '').trim() || testId;

        try {
            await ensureAdsInitialized(ads);
        } catch (err) {
            if (__DEV__) {
                console.warn('AdMob init failed', err);
            }
            done(false, null);
            return;
        }

        let settled = false;
        let earned = false;
        let loadTimer: ReturnType<typeof setTimeout> | null = null;
        let rewarded: ReturnType<typeof RewardedAd.createForAdRequest>;

        try {
            rewarded = RewardedAd.createForAdRequest(adUnit, {
                requestNonPersonalizedAdsOnly: Platform.OS === 'ios',
            });
        } catch (err) {
            if (__DEV__) {
                console.warn('AdMob create failed', err);
            }
            done(false, null);
            return;
        }

        const finish = async (ok: boolean) => {
            if (settled) {
                return;
            }
            settled = true;
            if (loadTimer) {
                clearTimeout(loadTimer);
                loadTimer = null;
            }
            unsub();
            const watched = !!(ok && earned);
            if (!watched) {
                done(false, null);
                return;
            }
            if (!report) {
                done(true, null);
                return;
            }
            try {
                const reward = await reportAdReward();
                done(true, reward);
            } catch (e) {
                if (__DEV__) {
                    console.warn('reportAdReward failed', e);
                }
                done(true, null);
            }
        };

        const unsubLoaded = rewarded.addAdEventListener(
            RewardedAdEventType.LOADED,
            () => {
                if (__DEV__) {
                    console.log('AdMob rewarded LOADED, showing…', adUnit);
                }
                // RN Modal native Activity'nin üstünü kapatmasın
                useAnalysisLoadingStore.getState().setAdUiLocked(false);
                setTimeout(() => {
                    rewarded.show().catch(err => {
                        if (__DEV__) {
                            console.warn('AdMob show failed', err);
                        }
                        finish(false);
                    });
                }, 200);
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
        const unsubError = rewarded.addAdEventListener(
            AdEventType.ERROR,
            (err: unknown) => {
                if (__DEV__) {
                    console.warn('AdMob load/show error', err, 'unit=', adUnit);
                }
                finish(false);
            },
        );

        const unsub = () => {
            unsubLoaded();
            unsubEarned();
            unsubClosed();
            unsubError();
        };

        loadTimer = setTimeout(() => {
            if (__DEV__) {
                console.warn('AdMob load timeout', LOAD_TIMEOUT_MS, adUnit);
            }
            finish(false);
        }, LOAD_TIMEOUT_MS);

        try {
            if (__DEV__) {
                console.log('AdMob rewarded load()', adUnit);
            }
            rewarded.load();
        } catch (err) {
            if (__DEV__) {
                console.warn('AdMob load() threw', err);
            }
            finish(false);
        }
    });
}

/** 2 izleme → sunucu +1 hak. İzlenmezse veya sunucu raporu yoksa null. */
export function showRewardedAdForCredit(
    unitId: string,
): Promise<AdsRewardResponse | null> {
    return showRewardedAd(unitId, { report: true }).then(r =>
        r.watched && r.reward ? r.reward : null,
    );
}

/** Karşılaştırma kilidi: reklam izlenir, /ads/reward çağrılmaz (analiz hakkı yok). */
export function showRewardedAdForCompareUnlock(
    unitId: string,
): Promise<boolean> {
    return showRewardedAd(unitId, { report: false }).then(r => r.watched);
}
