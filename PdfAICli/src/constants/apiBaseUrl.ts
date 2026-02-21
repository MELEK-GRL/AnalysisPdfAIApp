import { Platform } from 'react-native';
import { API_BASE_URL as ENV_API_BASE_URL } from '@env';

/**
 * Dev build'de (.env cache'ine güvenmeden) her zaman yerel backend kullanılır.
 * Release build'de .env'deki API_BASE_URL kullanılır.
 */
export const getApiBaseUrl = (): string => {
    if (__DEV__) {
        return Platform.OS === 'ios'
            ? 'http://localhost:4000'
            : 'http://10.0.2.2:4000';
    }
    return ENV_API_BASE_URL?.trim() || 'https://analysispdfaiapp-production.up.railway.app';
};

/** Tüm API istekleri bu base URL'i kullanmalı (apiFetcher, fetch fallback vb.). */
export const API_BASE_URL = getApiBaseUrl();
