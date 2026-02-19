const request = require('supertest');
const app = require('../src/app');
const LabHistory = require('../src/models/LabHistory');

const registerAndLogin = async () => {
    const reg = await request(app)
        .post('/api/auth/register')
        .send({ name: 'LabsUser', email: 'labs@example.com', password: '123456' });
    return reg.body.token;
};

describe('Labs', () => {
    describe('GET /api/labs/history', () => {
        it('token olmadan 401 döner', async () => {
            const res = await request(app).get('/api/labs/history');
            expect(res.status).toBe(401);
        });

        it('geçerli token ile boş liste döner', async () => {
            const token = await registerAndLogin();
            const res = await request(app)
                .get('/api/labs/history')
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('items');
            expect(Array.isArray(res.body.items)).toBe(true);
            expect(res.body.items).toHaveLength(0);
        });

        it('kullanıcının geçmiş kayıtlarını döner', async () => {
            const token = await registerAndLogin();
            const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
            const userId = me.body.user._id;

            await LabHistory.create({
                user: userId,
                pdfName: 'test.pdf',
                items: [{ test: 'Hemoglobin', value: 14, unit: 'g/dL', refLow: 12, refHigh: 16 }],
                analysis: 'Test analiz',
            });

            const res = await request(app)
                .get('/api/labs/history')
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body.items).toHaveLength(1);
            expect(res.body.items[0]).toMatchObject({
                pdfName: 'test.pdf',
                itemCount: 1,
                analysis: 'Test analiz',
            });
        });
    });

    describe('GET /api/labs/history/:id', () => {
        it('token olmadan 401 döner', async () => {
            const res = await request(app).get('/api/labs/history/someid');
            expect(res.status).toBe(401);
        });

        it('geçerli id ile detay döner', async () => {
            const token = await registerAndLogin();
            const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
            const userId = me.body.user._id;

            const created = await LabHistory.create({
                user: userId,
                pdfName: 'detail.pdf',
                items: [{ test: 'Glukoz', value: 95, unit: 'mg/dL' }],
                analysis: 'Detay analiz',
            });

            const res = await request(app)
                .get(`/api/labs/history/${created._id}`)
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body.pdfName).toBe('detail.pdf');
            expect(res.body.items).toHaveLength(1);
            expect(res.body.items[0].test).toBe('Glukoz');
        });

        it('başka kullanıcının kaydına 404 döner', async () => {
            const token = await registerAndLogin();
            const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

            const other = await request(app)
                .post('/api/auth/register')
                .send({ name: 'OtherUser', email: 'other@x.com', password: '123456' });
            const otherMe = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${other.body.token}`);
            const otherId = otherMe.body.user._id;

            const created = await LabHistory.create({
                user: otherId,
                pdfName: 'other.pdf',
                items: [],
                analysis: null,
            });

            const res = await request(app)
                .get(`/api/labs/history/${created._id}`)
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(404);
        });
    });

    describe('GET /api/labs/latest', () => {
        it('token olmadan 401 döner', async () => {
            const res = await request(app).get('/api/labs/latest');
            expect(res.status).toBe(401);
        });

        it('geçerli token ile boş items döner', async () => {
            const token = await registerAndLogin();
            const res = await request(app)
                .get('/api/labs/latest')
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body.items).toEqual([]);
            expect(res.body.updatedAt).toBeNull();
        });
    });
});
