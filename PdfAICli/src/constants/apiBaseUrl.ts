import { Platform } from 'react-native';
import { API_BASE_URL as ENV_API_BASE_URL } from '@env';

/**
 * Dev build'de: .env'de API_BASE_URL varsa onu kullan (gerçek cihazda Mac IP için).
 * Yoksa simulator/emulator için localhost / 10.0.2.2.
 * Release build'de .env'deki API_BASE_URL kullanılır.
 */
export const getApiBaseUrl = (): string => {
    const envUrl = ENV_API_BASE_URL?.trim().replace(/\/+$/, '');
    if (__DEV__) {
        if (envUrl) return envUrl;
        return Platform.OS === 'ios'
            ? 'http://localhost:4000'
            : 'http://10.0.2.2:4000';
    }
    return envUrl || 'https://analysispdfaiapp-production.up.railway.app';
};

/** Tüm API istekleri bu base URL'i kullanmalı (apiFetcher, fetch fallback vb.). */
export const API_BASE_URL = getApiBaseUrl();
