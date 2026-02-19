import { api } from '../apiFetcher';
import { getInstallationId } from '../../utils/analytics/getInstallationId';
import { Platform } from 'react-native';

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

async function sendEvent(payload: AnalyticsPayload): Promise<void> {
    try {
        const installationId = await getInstallationId();
        await api.post('/analytics', {
            ...payload,
            installationId,
            platform: Platform.OS,
        });
    } catch (_) {
        // Analytics hatalarını sessizce yut – uygulama akışını bozma
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
