import { API_BASE_URL as ENV_API_BASE_URL } from '@env';

/** Emülatör / prod varsayılanı — her zaman Railway production */
export const RAILWAY_API_BASE_URL =
    'https://analysispdfaiapp-production.up.railway.app';

/**
 * API base URL.
 * Emülatör (dev) dahil varsayılan Railway; .env ile override edilebilir.
 */
export const getApiBaseUrl = (): string => {
    const envUrl = ENV_API_BASE_URL?.trim().replace(/\/+$/, '');
    return envUrl || RAILWAY_API_BASE_URL;
};

/** Tüm API istekleri bu base URL'i kullanmalı (apiFetcher, fetch fallback vb.). */
export const API_BASE_URL = getApiBaseUrl();
