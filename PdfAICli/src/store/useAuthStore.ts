import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_TOKEN } from '../constants/storageKeys';

export type User = { _id: string; name: string; email?: string } | null;

type AuthState = {
    user: User;
    token: string | null;
    setUserAndToken: (u: NonNullable<User>, t: string) => Promise<void>;
    logout: () => Promise<void>;
};

/** apiFetcher'ı lazy yükle — circular import (getSnapshot null) önlenir */
async function persistToken(token: string | null) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { setToken, clearToken } = require('../server/apiFetcher') as {
        setToken: (t: string) => Promise<void>;
        clearToken: () => Promise<void>;
    };
    if (token) {
        await setToken(token);
    } else {
        await clearToken();
    }
}

/**
 * Oturum process ömrü kadar.
 * Persist yok: uygulama kapanıp açılınca Login.
 * Token AsyncStorage'da yalnızca aktif oturum için; cold start'ta silinir.
 */
export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    setUserAndToken: async (u, t) => {
        await persistToken(t);
        set({ user: u, token: t });
    },
    logout: async () => {
        await persistToken(null);
        await AsyncStorage.multiRemove([
            AUTH_TOKEN,
            '@user',
            '@settings',
            'auth-store',
        ]);
        set({ user: null, token: null });
    },
}));
