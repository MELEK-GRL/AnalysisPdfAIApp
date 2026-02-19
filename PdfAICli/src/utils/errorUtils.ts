/**
 * Ağ hatası (bağlantı, timeout) ile sunucu hatası (401, 500 vb.) ayrımı
 */
export function isNetworkError(err: unknown): boolean {
    const e = err as { code?: string; message?: string; response?: unknown };
    if (e?.code === 'ERR_NETWORK') return true;
    if (e?.code === 'ECONNABORTED') return true; // timeout
    if (e?.message === 'Network Error') return true;
    return !e?.response; // response yoksa genelde ağ sorunu
}
