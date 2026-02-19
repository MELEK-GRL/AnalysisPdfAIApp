import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* eslint-disable @typescript-eslint/no-require-imports */
const tr = require('../locales/tr.json') as Record<string, unknown>;
const en = require('../locales/en.json') as Record<string, unknown>;

export type LocaleCode = 'tr' | 'en';

const locales: Record<LocaleCode, Record<string, unknown>> = { tr, en };

type LocaleState = {
    locale: LocaleCode;
    setLocale: (code: LocaleCode) => Promise<void>;
    t: (key: string) => string;
};

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
    const keys = path.split('.');
    let current: unknown = obj;
    for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
            current = (current as Record<string, unknown>)[k];
        } else {
            return undefined;
        }
    }
    return typeof current === 'string' ? current : undefined;
}

export const useLocaleStore = create<LocaleState>()(
    persist(
        (set, get) => ({
            locale: 'tr',
            setLocale: async (code: LocaleCode) => {
                set({ locale: code });
            },
            t: (key: string) => {
                const { locale } = get();
                const dict = locales[locale];
                const value = getNested(dict as Record<string, unknown>, key);
                return value ?? key;
            },
        }),
        {
            name: 'locale-store',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (s) => ({ locale: s.locale }),
        },
    ),
);

/** Locale değiştiğinde bile bileşenlerin yeniden render olması için locale'e abone olur */
export function useT() {
    useLocaleStore((s) => s.locale);
    return useLocaleStore((s) => s.t);
}
