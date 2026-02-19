import axios, { AxiosError, AxiosRequestConfig, Method } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';
import { AUTH_TOKEN } from '../constants/storageKeys';
import { API_TIMEOUT_MS } from '../constants/api';

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
        (api.defaults.headers as any).common = {
            ...(api.defaults.headers as any).common,
            Authorization: `Bearer ${token}`,
        };
    } else if ((api.defaults.headers as any).common) {
        delete (api.defaults.headers as any).common.Authorization;
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
    const h: Record<string, any> = (config.headers as any) || {};

    if (!h.Authorization) {
        const token = await AsyncStorage.getItem(AUTH_TOKEN);
        if (token) {
            h.Authorization = `Bearer ${token}`;
        }
    }
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

    if (__DEV__) {
        console.log(
            '[REQ]',
            config.method?.toUpperCase(),
            (config.baseURL || '') + (config.url || ''),
        );
    }
    return config;
});

api.interceptors.response.use(
    res => {
        if (__DEV__) {
            console.log('[RES]', res.status, res.config.url);
        }
        return res;
    },
    async error => {
        if (__DEV__) {
            const msg = error?.message || 'Unknown error';
            const status = error?.response?.status;
            const url = error?.config?.url || '';
            const code = (error as any)?.code;
            const detail = [msg, code, status ? `HTTP ${status}` : null, url]
                .filter(Boolean)
                .join(' | ');
            console.warn('[API ERR]', detail);
        }
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
