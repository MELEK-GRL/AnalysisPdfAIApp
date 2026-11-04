import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { api } from '../apiFetcher';
import { getInstallationId } from '../../utils/analytics/getInstallationId';
import {
    firebaseLogEvent,
    firebaseLogLogin,
    firebaseLogScreenView,
} from '../../utils/analytics/firebaseAnalytics';
import { CONSENT_GIVEN_ONCE } from '../../constants/storageKeys';

type EventType = 'screen_view' | 'button_click' | 'login' | 'event';

type AnalyticsPayload = {
    eventType: EventType;
    screen?: string;
    buttonId?: string;
    durationSeconds?: number;
    metadata?: Record<string, unknown>;
    installationId?: string;
    platform?: string;
};

/** KVKK: Rıza yoksa analytics gönderilmez (backend + GA). */
async function sendEvent(payload: AnalyticsPayload): Promise<void> {
    try {
        const consent = await AsyncStorage.getItem(CONSENT_GIVEN_ONCE);
        if (consent !== '1') return;

        const installationId = await getInstallationId();

        // Backend ve GA birbirinden bağımsız – biri düşse diğeri devam eder
        await Promise.allSettled([
            api.post('/analytics', {
                ...payload,
                installationId,
                platform: Platform.OS,
            }),
            sendToFirebase(payload),
        ]);
    } catch (_) {
        // Analytics hatalarını sessizce yut – uygulama akışını bozma
    }
}

async function sendToFirebase(payload: AnalyticsPayload): Promise<void> {
    try {
        switch (payload.eventType) {
            case 'screen_view':
                if (payload.screen) {
                    await firebaseLogScreenView(
                        payload.screen,
                        payload.durationSeconds
                    );
                }
                break;
            case 'button_click':
                await firebaseLogEvent('button_click', {
                    button_id: payload.buttonId,
                    screen: payload.screen,
                    ...payload.metadata,
                });
                break;
            case 'login':
                await firebaseLogLogin();
                break;
            case 'event':
            default:
                await firebaseLogEvent('app_event', {
                    screen: payload.screen,
                    ...payload.metadata,
                });
                break;
        }
    } catch (_) {
        // GA hataları uygulamayı bozmasın
    }
}

export function trackEvent(
    eventType: EventType,
    options?: { screen?: string; metadata?: Record<string, unknown> }
): void {
    sendEvent({
        eventType,
        screen: options?.screen,
        metadata: options?.metadata,
    });
}

export function trackScreenView(
    screen: string,
    durationSeconds?: number,
    metadata?: Record<string, unknown>
): void {
    sendEvent({
        eventType: 'screen_view',
        screen,
        durationSeconds: durationSeconds ?? undefined,
        metadata,
    });
}

export function trackButtonClick(
    buttonId: string,
    options?: { screen?: string; metadata?: Record<string, unknown> }
): void {
    sendEvent({
        eventType: 'button_click',
        buttonId,
        screen: options?.screen,
        metadata: options?.metadata,
    });
}
