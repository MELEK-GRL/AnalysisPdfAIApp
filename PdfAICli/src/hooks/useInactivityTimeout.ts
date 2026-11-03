import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useSessionStore } from '../store/useSessionStore';
import { useAnalysisLoadingStore } from '../store/useAnalysisLoadingStore';
import {
    SESSION_TIMEOUT_MS,
    SESSION_CHECK_INTERVAL_MS,
    SESSION_BACKGROUND_GRACE_MS,
} from '../constants/limits';
import {
    decideOnBackground,
    shouldLogoutAfterBackgroundGrace,
    shouldLogoutForIdle,
} from '../utils/sessionPolicy';

/**
 * Oturum güvenliği:
 * - Ön planda 20 dk hareketsizlikte logout.
 * - Arka planda hemen değil; SESSION_BACKGROUND_GRACE_MS sonra logout
 *   (PDF seçici / reklam app'i background'a attığı için anında çıkış bozuluyordu).
 * - Analiz / hold varken arka plan timer başlamaz / ateşlenmez.
 * - Hold kazanılınca bekleyen arka plan timer iptal edilir.
 * - Ön plana dönüşte arka plan timer iptal; idle süresi sıfırlanmaz.
 */
export function useInactivityTimeout(): void {
    const token = useAuthStore(s => s.token);
    const logout = useAuthStore(s => s.logout);
    const loggingOutRef = useRef(false);
    const backgroundTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );

    useEffect(() => {
        if (!token) {
            loggingOutRef.current = false;
            if (backgroundTimerRef.current) {
                clearTimeout(backgroundTimerRef.current);
                backgroundTimerRef.current = null;
            }
            return;
        }

        useSessionStore.getState().touch();
        loggingOutRef.current = false;

        const clearBackgroundTimer = () => {
            if (backgroundTimerRef.current) {
                clearTimeout(backgroundTimerRef.current);
                backgroundTimerRef.current = null;
            }
        };

        const doLogout = () => {
            if (loggingOutRef.current) return;
            loggingOutRef.current = true;
            clearBackgroundTimer();
            void logout();
        };

        const getFlags = () => {
            const { loading, holdCount } = useAnalysisLoadingStore.getState();
            return { loading, holdCount };
        };

        const scheduleBackgroundLogout = () => {
            clearBackgroundTimer();
            backgroundTimerRef.current = setTimeout(() => {
                backgroundTimerRef.current = null;
                if (
                    shouldLogoutAfterBackgroundGrace({
                        appStillBackground: AppState.currentState === 'background',
                        flags: getFlags(),
                    })
                ) {
                    doLogout();
                }
            }, SESSION_BACKGROUND_GRACE_MS);
        };

        const checkIdle = () => {
            if (
                shouldLogoutForIdle({
                    now: Date.now(),
                    lastActivityAt: useSessionStore.getState().lastActivityAt,
                    timeoutMs: SESSION_TIMEOUT_MS,
                })
            ) {
                doLogout();
            }
        };

        const onAppStateChange = (nextState: AppStateStatus) => {
            if (nextState === 'background') {
                const decision = decideOnBackground({
                    isDev: __DEV__,
                    flags: getFlags(),
                    graceMs: SESSION_BACKGROUND_GRACE_MS,
                });
                if (decision.action === 'skip') {
                    clearBackgroundTimer();
                    return;
                }
                if (decision.action === 'logout_now') {
                    doLogout();
                    return;
                }
                scheduleBackgroundLogout();
                return;
            }
            if (nextState === 'active') {
                clearBackgroundTimer();
                checkIdle();
            }
        };

        // Hold / loading açılırken bekleyen background timer'ı iptal et
        const unsubHold = useAnalysisLoadingStore.subscribe(state => {
            if (state.loading || state.holdCount > 0) {
                clearBackgroundTimer();
            } else if (
                !__DEV__ &&
                AppState.currentState === 'background' &&
                !backgroundTimerRef.current &&
                !loggingOutRef.current
            ) {
                // Hold bitti, hâlâ arka plandayız → grace timer başlat
                scheduleBackgroundLogout();
            }
        });

        const sub = AppState.addEventListener('change', onAppStateChange);
        const id = setInterval(checkIdle, SESSION_CHECK_INTERVAL_MS);

        return () => {
            sub.remove();
            unsubHold();
            clearInterval(id);
            clearBackgroundTimer();
        };
    }, [token, logout]);
}
