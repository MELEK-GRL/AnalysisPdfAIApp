/**
 * Oturum hareketsizlik süresi – 20 dk işlem yoksa çıkış için.
 * lastActivityAt: son aktivite zamanı (timestamp).
 * touch(): aktivite olduğunda çağrılır (App ön plana gelince, API isteği vb.).
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
