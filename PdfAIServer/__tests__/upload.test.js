const request = require('supertest');
const path = require('path');
const fs = require('fs');

const mockExtractText = jest.fn();
const mockClassifyAndExtract = jest.fn();
jest.mock('../src/services/pdf', () => ({ extractTextFromPdf: (...args) => mockExtractText(...args) }));
jest.mock('../src/services/openai', () => ({ classifyAndExtract: (...args) => mockClassifyAndExtract(...args) }));

const app = require('../src/app');
const LabHistory = require('../src/models/LabHistory');

const registerAndGetToken = async () => {
    const reg = await request(app)
        .post('/api/auth/register')
        .send({ name: 'UploadUser', email: `upload-${Date.now()}@example.com`, password: '123456', termsAccepted: true });
    return reg.body.token;
};

describe('Upload', () => {
    beforeEach(() => {
        mockExtractText.mockReset();
        mockClassifyAndExtract.mockReset();
    });

    describe('POST /api/upload', () => {
        it('token olmadan 401 döner', async () => {
            const res = await request(app).post('/api/upload');
            expect(res.status).toBe(401);
        });

        it('dosya olmadan 400 döner', async () => {
            const token = await registerAndGetToken();
            const res = await request(app)
                .post('/api/upload')
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/PDF|gerekli/);
        });

        it('geçerli PDF + mock analiz ile 200 ve items döner', async () => {
            mockExtractText.mockResolvedValue('Hemoglobin 14 g/dL');
            mockClassifyAndExtract.mockResolvedValue({
                isLab: true,
                confidence: 0.9,
                items: [{ test: 'Hemoglobin', value: 14, unit: 'g/dL' }],
                analysis: 'Normal aralıkta.',
            });
            const token = await registerAndGetToken();
            const pdfBuffer = Buffer.from('%PDF-1.4 dummy');
            const res = await request(app)
                .post('/api/upload')
                .set('Authorization', `Bearer ${token}`)
                .attach('file', pdfBuffer, { filename: 'test.pdf', contentType: 'application/pdf' });
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('items');
            expect(res.body.type).toBe('lab');
            expect(res.body.items).toHaveLength(1);
            expect(res.body.items[0].test).toBe('Hemoglobin');
        });
    });
});
