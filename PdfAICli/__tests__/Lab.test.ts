/**
 * Lab API modülü – API mock ile birim testleri
 */
import * as Lab from '../src/server/api/Lab';

jest.mock('../src/server/apiFetcher', () => ({
    api: {
        get: jest.fn(),
        post: jest.fn(),
        delete: jest.fn(),
    },
    getToken: jest.fn(),
}));

const { api } = require('../src/server/apiFetcher');

describe('Lab API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getLabHistory', () => {
        it('items dizisini döner', async () => {
            (api.get as jest.Mock).mockResolvedValue({
                data: {
                    items: [
                        { id: '1', pdfName: 'a.pdf', createdAt: '2024-01-01', itemCount: 2, analysis: 'Ok' },
                    ],
                },
            });
            const result = await Lab.getLabHistory();
            expect(api.get).toHaveBeenCalledWith('/labs/history');
            expect(result).toHaveLength(1);
            expect(result[0].pdfName).toBe('a.pdf');
        });

        it('boş yanıtta boş dizi döner', async () => {
            (api.get as jest.Mock).mockResolvedValue({ data: {} });
            const result = await Lab.getLabHistory();
            expect(result).toEqual([]);
        });
    });

    describe('getLabHistoryItem', () => {
        it('id ile detay döner', async () => {
            (api.get as jest.Mock).mockResolvedValue({
                data: {
                    id: '1',
                    pdfName: 'x.pdf',
                    createdAt: '2024-01-01',
                    items: [{ test: 'Hb', value: 14 }],
                    analysis: 'Normal',
                },
            });
            const result = await Lab.getLabHistoryItem('1');
            expect(api.get).toHaveBeenCalledWith('/labs/history/1');
            expect(result.pdfName).toBe('x.pdf');
            expect(result.items).toHaveLength(1);
        });
    });

    describe('uploadPdf', () => {
        it('429 yanıtında isRateLimit hatası fırlatır', async () => {
            const form = new FormData();
            (api.post as jest.Mock).mockRejectedValue({
                response: { status: 429, data: { message: 'Limit aşıldı' } },
            });
            await expect(Lab.uploadPdf(form)).rejects.toMatchObject({
                message: expect.stringMatching(/limit|24|2/i),
                isRateLimit: true,
            });
        });
    });
});
