// src/server/apiFetcher.ts
import axios, { AxiosError, AxiosRequestConfig, Method } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';

const TOKEN_KEY = '@auth_token';

export const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: 15000,
});

// ⛏️ RN/axios bazı sürümlerde method-specific default CT atıyor.
// Hepsini baştan TEMİZLE.
const d = api.defaults.headers as any;
['common', 'post', 'put', 'patch'].forEach(k => {
    if (d[k]?.['Content-Type']) {
        delete d[k]['Content-Type'];
    }
    if (d[k]?.['content-type']) {
        delete d[k]['content-type'];
    }
});

/** ---- default Authorization ---- */
export function setAuthHeader(token?: string | null) {
    if (token) {
        (api.defaults.headers as any).common = {
            ...(api.defaults.headers as any).common,
            Authorization: `Bearer ${token}`,
        };
    } else if ((api.defaults.headers as any).common) {
        delete (api.defaults.headers as any).common.Authorization;
    }
}

export async function setToken(token: string) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    setAuthHeader(token);
}
export async function clearToken() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setAuthHeader(null);
}
export const getToken = () => AsyncStorage.getItem(TOKEN_KEY);

// REQUEST LOG + FormData fix
api.interceptors.request.use(async config => {
    const h: Record<string, any> = (config.headers as any) || {};

    // Auth ekle
    if (!h.Authorization) {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
            h.Authorization = `Bearer ${token}`;
        }
    }

    // 🚑 FormData ise Content-Type’ı hem config’ten hem defaults’tan temizle
    const isFormData =
        typeof FormData !== 'undefined' &&
        (config.data instanceof FormData ||
            String(h['Content-Type'] || h['content-type']).includes(
                'multipart/form-data',
            ));

    if (isFormData) {
        delete h['Content-Type'];
        delete h['content-type'];
        (config as any).headers = h;

        // defaults’taki method CT’larını da tekrar sil
        const defs = api.defaults.headers as any;
        ['common', 'post', 'put', 'patch'].forEach(k => {
            if (defs[k]?.['Content-Type']) {
                delete defs[k]['Content-Type'];
            }
            if (defs[k]?.['content-type']) {
                delete defs[k]['content-type'];
            }
        });
    } else {
        (config as any).headers = h;
    }

    console.log(
        '[REQ]',
        config.method?.toUpperCase(),
        (config.baseURL || '') + (config.url || ''),
        'Auth:',
        h.Authorization ? String(h.Authorization).slice(0, 20) + '…' : 'NONE',
        'CT:',
        h['Content-Type'] || h['content-type'] || 'auto',
    );
    return config;
});

// RESPONSE / ERROR LOG
api.interceptors.response.use(
    res => {
        console.log('[RES]', res.status, res.config.url);
        return res;
    },
    async error => {
        console.log('[API ERR]', {
            message: error?.message,
            code: error?.code,
            status: error?.response?.status,
            data: error?.response?.data,
            url: error?.config?.url,
            timeout: error?.config?.timeout,
            reqHeaders: error?.config?.headers,
        });
        return Promise.reject(error);
    },
);

const normalizeError = (err: unknown) => {
    const e = err as AxiosError<any>;
    return (
        e.response?.data?.message ||
        e.response?.data?.error ||
        e.message ||
        'Bilinmeyen hata'
    );
};

export async function apiFetcher<T>(
    method: Method,
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
): Promise<T> {
    try {
        const res = await api.request<T>({ method, url, data, ...config });
        return res.data;
    } catch (err) {
        throw new Error(normalizeError(err));
    }
}

export const get = <T>(url: string, cfg?: AxiosRequestConfig) =>
    apiFetcher<T>('GET', url, undefined, cfg);
export const post = <T>(
    url: string,
    body?: unknown,
    cfg?: AxiosRequestConfig,
) => apiFetcher<T>('POST', url, body, cfg);
export const put = <T>(url: string, body?: unknown, cfg?: AxiosRequestConfig) =>
    apiFetcher<T>('PUT', url, body, cfg);
export const del = <T>(url: string, cfg?: AxiosRequestConfig) =>
    apiFetcher<T>('DELETE', url, undefined, cfg);
