import axios, { AxiosError, AxiosHeaders, AxiosRequestConfig, Method } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/apiBaseUrl';
import { AUTH_TOKEN } from '../constants/storageKeys';
import { API_TIMEOUT_MS } from '../constants/api';
import { useSessionStore } from '../store/useSessionStore';

export const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: API_TIMEOUT_MS,
});

const d = api.defaults.headers as any;
['common', 'post', 'put', 'patch'].forEach(k => {
    if (d[k]?.['Content-Type']) {
        delete d[k]['Content-Type'];
    }
    if (d[k]?.['content-type']) {
        delete d[k]['content-type'];
    }
});

export function setAuthHeader(token?: string | null) {
    if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common.Authorization;
    }
}

export async function setToken(token: string) {
    await AsyncStorage.setItem(AUTH_TOKEN, token);
    setAuthHeader(token);
}
export async function clearToken() {
    await AsyncStorage.removeItem(AUTH_TOKEN);
    setAuthHeader(null);
}
export const getToken = () => AsyncStorage.getItem(AUTH_TOKEN);

api.interceptors.request.use(async config => {
    const headers = AxiosHeaders.from(config.headers || {});

    // FormData: boundary axios/RN tarafından set edilsin diye Content-Type'ı kaldır.
    const isFormData =
        typeof FormData !== 'undefined' &&
        (config.data instanceof FormData ||
            String(headers.get('Content-Type') || '').includes(
                'multipart/form-data',
            ));

    if (isFormData) {
        headers.delete('Content-Type');
        headers.delete('content-type');

        const defs = api.defaults.headers as any;
        ['common', 'post', 'put', 'patch'].forEach(k => {
            if (defs[k]?.['Content-Type']) {
                delete defs[k]['Content-Type'];
            }
            if (defs[k]?.['content-type']) {
                delete defs[k]['content-type'];
            }
        });
    }

    // Authorization'ı FormData temizliği SONRASINDA her zaman yeniden yaz.
    // Axios 1.x + multipart isteklerinde header kaybolabiliyor.
    if (!headers.get('Authorization')) {
        const token = await AsyncStorage.getItem(AUTH_TOKEN);
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
    }

    config.headers = headers;
    return config;
});

api.interceptors.response.use(
    res => {
        useSessionStore.getState().touch();
        return res;
    },
    async error => {
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
        // AxiosError'ı olduğu gibi ilet; aksi halde response/code kaybolur ve
        // isNetworkError her zaman "bağlantı yok" sanır (4xx/5xx bile olsa).
        if (axios.isAxiosError(err)) {
            throw err;
        }
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
export const del = <T>(url: string, cfg?: AxiosRequestConfig) =>
    apiFetcher<T>('DELETE', url, undefined, cfg);
