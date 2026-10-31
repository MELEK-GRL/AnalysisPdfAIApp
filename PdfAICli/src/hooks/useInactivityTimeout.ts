import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useSessionStore } from '../store/useSessionStore';
import { useAnalysisLoadingStore } from '../store/useAnalysisLoadingStore';
import { SESSION_TIMEOUT_MS, SESSION_CHECK_INTERVAL_MS } from '../constants/limits';

/**
 * Oturum güvenliği:
 * - Uygulama ön planda açıkken 20 dk hareketsizlikte logout.
 * - Uygulama arka plana alınca / kapanınca logout (token silinir).
 * - Analiz yüklenirken arka plana çıkışta logout yok (upload bozulmasın).
 * - Ön plana dönüşte süre SIFIRLANMAZ.
 */
export function useInactivityTimeout(): void {
    const token = useAuthStore((s) => s.token);
    const logout = useAuthStore((s) => s.logout);
    const loggingOutRef = useRef(false);

    useEffect(() => {
        if (!token) {
            loggingOutRef.current = false;
            return;
        }

        useSessionStore.getState().touch();
        loggingOutRef.current = false;

        const doLogout = () => {
            if (loggingOutRef.current) return;
            loggingOutRef.current = true;
            void logout();
        };

        const checkIdle = () => {
            const last = useSessionStore.getState().lastActivityAt;
            if (Date.now() - last >= SESSION_TIMEOUT_MS) {
                doLogout();
            }
        };

        const onAppStateChange = (nextState: AppStateStatus) => {
            if (nextState === 'background') {
                // Dev'de emulator/IDE geçişinde logout uygulama "crash" gibi görünür.
                if (__DEV__) {
                    return;
                }
                // Analiz sürerken çıkarma; aksi halde kapatma / başka app = logout
                if (useAnalysisLoadingStore.getState().loading) {
                    return;
                }
                doLogout();
                return;
            }
            if (nextState === 'active') {
                checkIdle();
            }
        };

        const sub = AppState.addEventListener('change', onAppStateChange);

        const id = setInterval(checkIdle, SESSION_CHECK_INTERVAL_MS);

        return () => {
            sub.remove();
            clearInterval(id);
        };
    }, [token, logout]);
}
