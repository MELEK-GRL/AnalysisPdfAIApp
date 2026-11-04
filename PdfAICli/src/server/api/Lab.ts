import { api, getToken } from '../apiFetcher';
import { API_BASE_URL } from '../../constants/apiBaseUrl';
import { UPLOAD_TIMEOUT_MS } from '../../constants/api';

export type LabItem = {
    test: string;
    label?: string | null;
    value: number;
    unit?: string | null;
    refLow?: number | null;
    refHigh?: number | null;
    flag?: 'L' | 'N' | 'H';
    resultLabel?: string | null;
    /** Ölçüm sınırı altı/üstü için tam metin (örn. "<0.5", ">500") */
    valueDisplay?: string | null;
    /** Tahlil başlığı (İDRAR TETKİKİ, HEMOGRAM, BİYOKİMYA (ACİL) vb.) – kartları bu başlık altında gruplamak için */
    section?: string | null;
};
export type UploadResponse =
    | { type: 'lab'; confidence: number; items: LabItem[]; rawItems?: LabItem[]; analysis?: string }
    | {
        type: 'non-lab';
        confidence?: number;
        reason?: string;
        items: [];
        rawItems?: LabItem[];
        analysis?: string;
    };

export type LabHistoryItem = {
    id: string;
    pdfName: string | null;
    createdAt: string;
    itemCount: number;
    analysis: string | null;
};

export type LabHistoryDetail = {
    id: string;
    pdfName: string | null;
    createdAt: string;
    items: LabItem[];
    analysis: string | null;
    /** PDF'den gelen tahlil sahibi adı (varsa) */
    patientName?: string | null;
};

export async function getLatestLabs(): Promise<LabItem[]> {
    const res = await api.get<{ items?: LabItem[] }>('/labs/latest');
    return res.data.items ?? [];
}

export async function getLabHistory(): Promise<LabHistoryItem[]> {
    const res = await api.get<{ items: LabHistoryItem[] }>('/labs/history');
    return res.data.items ?? [];
}

export async function getLabHistoryItem(id: string): Promise<LabHistoryDetail> {
    const res = await api.get<LabHistoryDetail>(`/labs/history/${id}`);
    return res.data;
}

export async function deleteLabHistoryItem(id: string): Promise<void> {
    await api.delete(`/labs/history/${id}`);
}

export async function deleteAllLabHistory(): Promise<void> {
    await api.delete('/labs/history');
}

export type LabCompareSideValue = {
    value: number | null;
    unit: string | null;
    refLow: number | null;
    refHigh: number | null;
    flag: 'L' | 'N' | 'H' | null;
    status: string;
    resultLabel: string | null;
    valueDisplay?: string | null;
};

export type LabCompareCommonItem = {
    matchKey: string;
    name: string;
    lab1: LabCompareSideValue;
    lab2: LabCompareSideValue;
    transition: string | null;
    comparable: boolean;
    diff: number | null;
    percentChange: number | null;
    percentChangeLabel: string | null;
    /** up | down | flat — sayısal değer yönü */
    trend: 'up' | 'down' | 'flat' | null;
    trendLabel: string | null;
    unitMismatch: boolean;
    note: string | null;
    kind: 'numeric' | 'categorical';
};

export type LabCompareOnlyItem = {
    matchKey: string;
    name: string;
    side: 1 | 2;
    value: number | null;
    unit: string | null;
    refLow: number | null;
    refHigh: number | null;
    flag: 'L' | 'N' | 'H' | null;
    status: string;
    resultLabel: string | null;
    valueDisplay?: string | null;
    kind: 'numeric' | 'categorical';
};

export type LabComparisonResult = {
    id1: string | null;
    id2: string | null;
    lab1: { id: string | null; createdAt: string | null; pdfName: string | null };
    lab2: { id: string | null; createdAt: string | null; pdfName: string | null };
    summary: {
        commonCount: number;
        onlyLab1Count: number;
        onlyLab2Count: number;
    };
    common: LabCompareCommonItem[];
    onlyLab1: LabCompareOnlyItem[];
    onlyLab2: LabCompareOnlyItem[];
    noCommon: boolean;
};

/** İki tahlili karşılaştır (AI yok). id1/id2 seçim sırası. */
export async function compareLabs(
    id1: string,
    id2: string,
): Promise<LabComparisonResult> {
    const res = await api.post<{ comparison: LabComparisonResult }>(
        '/labs/compare',
        { id1, id2 },
    );
    return res.data.comparison;
}

export type RateLimitError = Error & {
    isRateLimit: true;
    adsEnabled?: boolean;
    rewardedUnitId?: string | null;
};

function throwRateLimit(data?: {
    message?: string;
    adsEnabled?: boolean;
    rewardedUnitId?: string | null;
}): never {
    const e = new Error(
        data?.message ||
            'Günlük analiz hakkınız doldu. 24 saat içinde en fazla 2 kez PDF analizi yapabilirsiniz.',
    ) as RateLimitError;
    e.isRateLimit = true;
    e.adsEnabled = data?.adsEnabled === true;
    e.rewardedUnitId = data?.rewardedUnitId ?? null;
    throw e;
}

type XhrResult = { status: number; body: string };

/**
 * RN Android'de fetch+FormData Authorization header'ını düşürebiliyor.
 * XMLHttpRequest ile header güvenilir şekilde gider.
 */
function postFormDataWithAuth(
    url: string,
    form: FormData,
    token: string,
    timeoutMs: number,
): Promise<XhrResult> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        // Authorization bazı RN Android multipart isteklerinde düşer;
        // X-Access-Token + query access_token yedek kanallar.
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('X-Access-Token', token);
        // Content-Type set etme — boundary XHR/RN tarafından eklenir
        xhr.timeout = timeoutMs;
        xhr.onload = () => {
            resolve({ status: xhr.status, body: xhr.responseText || '' });
        };
        xhr.onerror = () => {
            reject(new Error('Ağ hatası. İnternet bağlantınızı kontrol edin.'));
        };
        xhr.ontimeout = () => {
            reject(
                new Error(
                    'Yükleme zaman aşımına uğradı. Lütfen tekrar deneyin.',
                ),
            );
        };
        xhr.send(form);
    });
}

/**
 * PDF yükleme — önce token doğrula, sonra XHR ile multipart gönder.
 */
export async function uploadPdf(form: FormData): Promise<UploadResponse> {
    const token = await getToken();
    if (!token) {
        throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
    }

    // Aynı token ile basit auth kontrolü (upload öncesi)
    try {
        await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch (e: any) {
        const status = e?.response?.status;
        if (status === 401) {
            throw new Error(
                'Oturum geçersiz veya süresi dolmuş. Lütfen çıkış yapıp tekrar giriş yapın.',
            );
        }
        // me başarısız olsa bile upload'ı denemeye devam etme; token yoksa zaten 401
        if (!e?.response) {
            throw new Error(
                'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.',
            );
        }
    }

    const uploadUrl =
        `${API_BASE_URL}/api/upload` +
        `?access_token=${encodeURIComponent(token)}`;

    const { status, body } = await postFormDataWithAuth(
        uploadUrl,
        form,
        token,
        UPLOAD_TIMEOUT_MS,
    );

    let data: any = null;
    try {
        data = body ? JSON.parse(body) : null;
    } catch (_) {
        data = null;
    }

    if (status < 200 || status >= 300) {
        const msg =
            data?.message || body || `PDF yüklenemedi (HTTP ${status}).`;
        if (status === 429) {
            throwRateLimit({
                message: msg,
                adsEnabled: data?.adsEnabled === true,
                rewardedUnitId: data?.rewardedUnitId ?? null,
            });
        }
        if (status === 401) {
            throw new Error(
                'Yükleme yetkilendirmesi başarısız (401). Lütfen çıkış yapıp tekrar giriş yapın.',
            );
        }
        throw new Error(msg);
    }

    if (!data) {
        throw new Error('Sunucudan geçersiz yanıt alındı.');
    }
    return data as UploadResponse;
}

export type AdsRewardResponse = {
    ok: boolean;
    creditGranted: boolean;
    pendingAdWatches: number;
    adsNeededForNextCredit: number;
};

export type AdsStatusResponse = {
    ok: boolean;
    adsEnabled: boolean;
    limitDisabled?: boolean;
    baseLimit?: number;
    analysesUsed?: number;
    bonusUnused?: number;
    remaining?: number;
    allowed?: number;
    pendingAdWatches?: number;
    adsNeededForNextCredit?: number;
    rewardedUnitId?: string | null;
};

/** Günlük analiz kotası (header chip). */
export async function getAdsStatus(): Promise<AdsStatusResponse> {
    const res = await api.get<AdsStatusResponse>('/ads/status');
    return res.data;
}

/** Rewarded reklam tamamlandıktan sonra sunucuya bildir (2 izleme → +1 hak). */
export async function reportAdReward(): Promise<AdsRewardResponse> {
    const res = await api.post<AdsRewardResponse>('/ads/reward');
    return res.data;
}
