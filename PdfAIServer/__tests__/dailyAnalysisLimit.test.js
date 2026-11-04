const request = require('supertest');
const LabHistory = require('../src/models/LabHistory');
const AnalysisUsage = require('../src/models/AnalysisUsage');

const mockExtractText = jest.fn();
const mockClassifyAndExtract = jest.fn();
jest.mock('../src/services/pdf', () => ({ extractTextFromPdf: (...args) => mockExtractText(...args) }));
jest.mock('../src/services/openai', () => ({
    classifyAndExtract: (...args) => mockClassifyAndExtract(...args),
    finalizeLabItems: (items) => items || [],
}));

const app = require('../src/app');

describe('Daily analysis limit (24h/2)', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalAppEnv = process.env.APP_ENV;

    afterEach(() => {
        process.env.NODE_ENV = originalNodeEnv;
        process.env.APP_ENV = originalAppEnv;
    });

    it('UAT/PROD (dev değil) ve kullanıcı 24h içinde 2 analiz yaptıysa 3. istek 429 döner', async () => {
        process.env.NODE_ENV = 'production';
        process.env.APP_ENV = 'uat';
        mockExtractText.mockResolvedValue('Lab text');
        mockClassifyAndExtract.mockResolvedValue({
            isLab: true,
            items: [],
            analysis: 'Ok',
        });

        const reg = await request(app)
            .post('/api/auth/register')
            .send({ name: 'LimitUser', email: `limit-${Date.now()}@example.com`, password: '123456', termsAccepted: true });
        const token = reg.body.token;
        const userId = reg.body.user._id;

        await LabHistory.create({
            user: userId,
            items: [],
            analysis: 'First',
            pdfName: 'a.pdf',
        });
        await LabHistory.create({
            user: userId,
            items: [],
            analysis: 'Second',
            pdfName: 'b.pdf',
        });

        const res = await request(app)
            .post('/api/upload')
            .set('Authorization', `Bearer ${token}`)
            .attach('file', Buffer.from('%PDF-1.4'), { filename: 'c.pdf', contentType: 'application/pdf' });

        expect(res.status).toBe(429);
        expect(res.body.code).toBe('RATE_LIMIT_EXCEEDED');
        expect(res.body.message).toMatch(/limit|24|2/);
    }, 15000);

    it('geçmiş silinse bile analiz hakkı geri gelmez (429 kalır)', async () => {
        process.env.NODE_ENV = 'production';
        process.env.APP_ENV = 'uat';
        mockExtractText.mockResolvedValue('Lab text');
        mockClassifyAndExtract.mockResolvedValue({
            isLab: true,
            items: [{ test: 'WBC', value: 1 }],
            analysis: 'Ok',
        });

        const reg = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'LimitDeleteUser',
                email: `limit-del-${Date.now()}@example.com`,
                password: '123456',
                termsAccepted: true,
            });
        const token = reg.body.token;
        const userId = reg.body.user._id;

        const h1 = await LabHistory.create({
            user: userId,
            items: [],
            analysis: 'First',
            pdfName: 'a.pdf',
        });
        const h2 = await LabHistory.create({
            user: userId,
            items: [],
            analysis: 'Second',
            pdfName: 'b.pdf',
        });
        await AnalysisUsage.create({ user: userId, sourceHistoryId: h1._id });
        await AnalysisUsage.create({ user: userId, sourceHistoryId: h2._id });

        const del = await request(app)
            .delete('/api/labs/history')
            .set('Authorization', `Bearer ${token}`);
        expect(del.status).toBe(200);
        expect(del.body.deletedCount).toBe(2);

        const remainingHistory = await LabHistory.countDocuments({ user: userId });
        expect(remainingHistory).toBe(0);
        const usageLeft = await AnalysisUsage.countDocuments({ user: userId });
        expect(usageLeft).toBe(2);

        const status = await request(app)
            .get('/api/ads/status')
            .set('Authorization', `Bearer ${token}`);
        expect(status.status).toBe(200);
        expect(status.body.remaining).toBe(0);
        expect(status.body.analysesUsed).toBe(2);

        const res = await request(app)
            .post('/api/upload')
            .set('Authorization', `Bearer ${token}`)
            .attach('file', Buffer.from('%PDF-1.4'), { filename: 'c.pdf', contentType: 'application/pdf' });

        expect(res.status).toBe(429);
        expect(res.body.code).toBe('RATE_LIMIT_EXCEEDED');
    }, 15000);
});
