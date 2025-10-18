// src/server/api/Lab.ts
import { api, getToken } from '../apiFetcher';
import { API_BASE_URL } from '@env';

export type LabItem = {
    test: string;
    label?: string | null;
    value: number;
    unit?: string | null;
    refLow?: number | null;
    refHigh?: number | null;
    flag?: 'L' | 'N' | 'H';
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

export async function getLatestLabs(): Promise<LabItem[]> {
    const res = await api.get<{ items?: LabItem[] }>('/labs/latest');
    return res.data.items ?? [];
}

export async function uploadPdf(form: FormData): Promise<UploadResponse> {
    try {
        const res = await api.post<UploadResponse>('/upload', form, {
            // ❌ Content-Type verme
            timeout: 60_000,
            responseType: 'json',
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
        });
        return res.data;
    } catch (e) {
        // 🔁 Axios “Network Error” ise fetch ile tekrar dene (debug için çok faydalı)
        const token = await getToken();
        const r = await fetch(`${API_BASE_URL}/api/upload`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            body: form,
        });
        if (!r.ok) {
            throw new Error(await r.text());
        }
        return (await r.json()) as UploadResponse;
    }
}
