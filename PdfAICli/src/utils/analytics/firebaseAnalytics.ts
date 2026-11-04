/**
 * Firebase Analytics (GA4) – native yoksa / hata olursa no-op.
 * Mevcut backend analytics akışını bozmaz.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';
import { CONSENT_GIVEN_ONCE } from '../../constants/storageKeys';

type AnalyticsFn = typeof import('@react-native-firebase/analytics').default;
type AnalyticsInstance = ReturnType<AnalyticsFn>;

let collectionEnabled: boolean | null = null;
let analyticsFn: AnalyticsFn | null | undefined;

function loadAnalyticsFn(): AnalyticsFn | null {
    if (analyticsFn !== undefined) return analyticsFn;

    // Soft check (ads ile aynı yaklaşım) – isimler yoksa yine de require dene
    const mods = NativeModules as Record<string, unknown>;
    const hinted = !!(
        mods.RNFBAppModule ||
        mods.RNFBAnalyticsModule ||
        Object.keys(mods).some(k => k.startsWith('RNFB'))
    );

    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require('@react-native-firebase/analytics').default as AnalyticsFn;
        if (typeof mod !== 'function') {
            analyticsFn = null;
            return null;
        }
        analyticsFn = mod;
        if (!hinted && __DEV__) {
            console.warn('[GA] RNFB NativeModules hint yok; require başarılı');
        }
        return analyticsFn;
    } catch (err) {
        if (__DEV__) {
            console.warn('[GA] Firebase Analytics yüklenemedi', err);
        }
        analyticsFn = null;
        return null;
    }
}

async function ensureCollectionEnabled(
    analytics: AnalyticsInstance
): Promise<void> {
    if (collectionEnabled === true) return;
    try {
        await analytics.setAnalyticsCollectionEnabled(true);
        collectionEnabled = true;
        if (__DEV__) {
            console.log('[GA] Analytics collection enabled');
        }
    } catch (err) {
        if (__DEV__) {
            console.warn('[GA] setAnalyticsCollectionEnabled failed', err);
        }
    }
}

/** Rıza varsa collection’ı aç (App açılışında çağır). */
export async function enableFirebaseAnalyticsIfConsented(): Promise<void> {
    try {
        const consent = await AsyncStorage.getItem(CONSENT_GIVEN_ONCE);
        if (consent !== '1') return;
        const mod = loadAnalyticsFn();
        if (!mod) return;
        await ensureCollectionEnabled(mod());
    } catch {
        // no-op
    }
}

function sanitizeParams(
    params?: Record<string, unknown>
): Record<string, string | number | boolean> | undefined {
    if (!params) return undefined;
    const out: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(params)) {
        if (value == null) continue;
        if (
            /pdf|lab|analysis|tahlil|result|openai|prompt|health/i.test(key)
        ) {
            continue;
        }
        if (
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean'
        ) {
            out[key.slice(0, 40)] =
                typeof value === 'string' ? value.slice(0, 100) : value;
        }
    }
    return Object.keys(out).length ? out : undefined;
}

export async function firebaseLogScreenView(
    screen: string,
    durationSeconds?: number
): Promise<void> {
    const mod = loadAnalyticsFn();
    if (!mod) return;
    try {
        const analytics = mod();
        await ensureCollectionEnabled(analytics);
        await analytics.logScreenView({
            screen_name: screen,
            screen_class: screen,
        });
        if (durationSeconds != null && durationSeconds > 0) {
            await analytics.logEvent('screen_time', {
                screen_name: screen,
                duration_seconds: Math.round(durationSeconds),
            });
        }
    } catch (err) {
        if (__DEV__) console.warn('[GA] logScreenView failed', err);
    }
}

export async function firebaseLogEvent(
    name: string,
    params?: Record<string, unknown>
): Promise<void> {
    const mod = loadAnalyticsFn();
    if (!mod) return;
    try {
        const analytics = mod();
        await ensureCollectionEnabled(analytics);
        const safeName = name.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40);
        await analytics.logEvent(safeName, sanitizeParams(params));
    } catch (err) {
        if (__DEV__) console.warn('[GA] logEvent failed', err);
    }
}

export async function firebaseLogLogin(): Promise<void> {
    const mod = loadAnalyticsFn();
    if (!mod) return;
    try {
        const analytics = mod();
        await ensureCollectionEnabled(analytics);
        await analytics.logLogin({ method: 'email' });
    } catch (err) {
        if (__DEV__) console.warn('[GA] logLogin failed', err);
    }
}
