import { api, getToken } from '../apiFetcher';
import { API_BASE_URL } from '@env';
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
};
export type UploadResponse =
    | { type: 'lab'; confidence: number; items: LabItem[]; analysis?: string }
    | {
        type: 'non-lab';
        confidence?: number;
        reason?: string;
        items: [];
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

export async function uploadPdf(form: FormData): Promise<UploadResponse> {
    const handleError = (err: any): never => {
        if (err?.response?.status === 429) {
            const e = new Error(
                err?.response?.data?.message ||
                    'Günlük analiz hakkınız doldu. 24 saat içinde en fazla 2 kez PDF analizi yapabilirsiniz.',
            ) as Error & { isRateLimit?: boolean };
            e.isRateLimit = true;
            throw e;
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
                const e = new Error(
                    msg || 'Günlük analiz hakkınız doldu. 24 saat içinde en fazla 2 kez PDF analizi yapabilirsiniz.',
                ) as Error & { isRateLimit?: boolean };
                e.isRateLimit = true;
                throw e;
            }
            throw new Error(msg);
        }
        return (await r.json()) as UploadResponse;
    }
}
