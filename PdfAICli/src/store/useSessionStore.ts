/**
 * Oturum hareketsizlik süresi – ön planda 20 dk işlem yoksa çıkış için.
 * lastActivityAt: son aktivite zamanı (timestamp).
 * touch(): gerçek kullanıcı/API aktivitesinde çağrılır (ön plana gelince çağrılmaz).
 */
import { create } from 'zustand';

const getNow = () => Date.now();

type SessionState = {
    lastActivityAt: number;
    touch: () => void;
};

export const useSessionStore = create<SessionState>()((set) => ({
    lastActivityAt: getNow(),
    touch: () => set({ lastActivityAt: getNow() }),
}));
