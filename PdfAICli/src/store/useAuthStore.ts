// src/store/useAuthStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    setToken as saveToken,
    clearToken as wipeToken,
} from '../server/apiFetcher';

export type User = { _id: string; name: string; email?: string } | null;

type AuthState = {
    user: User;
    token: string | null;
    setUserAndToken: (u: NonNullable<User>, t: string) => Promise<void>;
    logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            setUserAndToken: async (u, t) => {
                await saveToken(t); // apiFetcher'a yaz
                set({ user: u, token: t }); // store'a yaz
            },
            logout: async () => {
                // 1) token & header
                await wipeToken();

                // 2) varsa başka local/persist verileri temizle
                await AsyncStorage.multiRemove(['@user', '@settings']); // projene göre

                // 3) store'u temizle
                set({ user: null, token: null });
            },
        }),
        {
            name: 'auth-store',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: s => ({ user: s.user, token: s.token }),
        },
    ),
);
