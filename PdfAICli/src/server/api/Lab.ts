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

export async function uploadPdf(form: FormData): Promise<UploadResponse> {
    const handleError = (err: any): never => {
        if (err?.response?.status === 429) {
            throwRateLimit(err?.response?.data);
        }
        const msg = err?.response?.data?.message || err?.message || 'PDF yüklenemedi.';
        throw new Error(msg);
    };

    try {
        const res = await api.post<UploadResponse>('/upload', form, {
            timeout: UPLOAD_TIMEOUT_MS,
            responseType: 'json',
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
        });
        return res.data;
    } catch (e: any) {
        if (e?.response) handleError(e);
        const token = await getToken();
        const r = await fetch(`${API_BASE_URL}/api/upload`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            body: form,
        });
        if (!r.ok) {
            const text = await r.text();
            let msg = text;
            try {
                const j = JSON.parse(text);
                if (j?.message) msg = j.message;
            } catch (_) {}
            if (r.status === 429) {
                let adsEnabled = false;
                let rewardedUnitId: string | null = null;
                try {
                    const j = JSON.parse(text);
                    adsEnabled = j?.adsEnabled === true;
                    rewardedUnitId = j?.rewardedUnitId || null;
                } catch (_) {}
                throwRateLimit({ message: msg, adsEnabled, rewardedUnitId });
            }
            throw new Error(msg);
        }
        return (await r.json()) as UploadResponse;
    }
}

export type AdsRewardResponse = {
    ok: boolean;
    creditGranted: boolean;
    pendingAdWatches: number;
    adsNeededForNextCredit: number;
};

/** Rewarded reklam tamamlandıktan sonra sunucuya bildir (2 izleme → +1 hak). */
export async function reportAdReward(): Promise<AdsRewardResponse> {
    const res = await api.post<AdsRewardResponse>('/ads/reward');
    return res.data;
}
