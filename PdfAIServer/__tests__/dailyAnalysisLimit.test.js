const request = require('supertest');
const LabHistory = require('../src/models/LabHistory');

const mockExtractText = jest.fn();
const mockClassifyAndExtract = jest.fn();
jest.mock('../src/services/pdf', () => ({ extractTextFromPdf: (...args) => mockExtractText(...args) }));
jest.mock('../src/services/openai', () => ({ classifyAndExtract: (...args) => mockClassifyAndExtract(...args) }));

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
});
