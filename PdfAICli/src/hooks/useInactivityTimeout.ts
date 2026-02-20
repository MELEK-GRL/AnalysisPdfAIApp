import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useSessionStore } from '../store/useSessionStore';
import { SESSION_TIMEOUT_MS, SESSION_CHECK_INTERVAL_MS } from '../constants/limits';

/**
 * Giriş yapılmışken 20 dk hareketsizlikte otomatik çıkış.
 * - Uygulama ön plana gelince (AppState active) son aktivite güncellenir.
 * - Periyodik kontrol ile süre aşılırsa logout() çağrılır.
 */
export function useInactivityTimeout(): void {
    const token = useAuthStore((s) => s.token);
    const logout = useAuthStore((s) => s.logout);

    useEffect(() => {
        if (!token) return;

        useSessionStore.getState().touch();

        const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
            if (nextState === 'active') {
                useSessionStore.getState().touch();
            }
        });

        const id = setInterval(() => {
            const now = Date.now();
            const last = useSessionStore.getState().lastActivityAt;
            if (now - last >= SESSION_TIMEOUT_MS) {
                logout();
            }
        }, SESSION_CHECK_INTERVAL_MS);

        return () => {
            sub.remove();
            clearInterval(id);
        };
    }, [token, logout]);
}
