const request = require('supertest');
const app = require('../src/app');

describe('Analytics', () => {
    describe('POST /api/analytics', () => {
        it('eventType olmadan 400 döner', async () => {
            const res = await request(app).post('/api/analytics').send({});
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/eventType|Geçersiz/);
        });

        it('geçersiz eventType ile 400 döner', async () => {
            const res = await request(app)
                .post('/api/analytics')
                .send({ eventType: 'invalid_type' });
            expect(res.status).toBe(400);
        });

        it('screen_view ile 201 döner', async () => {
            const res = await request(app)
                .post('/api/analytics')
                .send({ eventType: 'screen_view', screen: 'Home' });
            expect(res.status).toBe(201);
            expect(res.body).toEqual({ ok: true });
        });

        it('button_click ile 201 döner', async () => {
            const res = await request(app)
                .post('/api/analytics')
                .send({ eventType: 'button_click', buttonId: 'upload_btn', screen: 'Home' });
            expect(res.status).toBe(201);
        });

        it('login eventType ile 201 döner', async () => {
            const res = await request(app)
                .post('/api/analytics')
                .send({ eventType: 'login' });
            expect(res.status).toBe(201);
        });

        it('event eventType ile 201 döner', async () => {
            const res = await request(app)
                .post('/api/analytics')
                .send({ eventType: 'event', metadata: { key: 'value' } });
            expect(res.status).toBe(201);
        });

        it('token varsa user ilişkilendirilir (hata vermez)', async () => {
            const reg = await request(app)
                .post('/api/auth/register')
                .send({ name: 'AnalyticsUser', email: 'analytics@example.com', password: '123456' });
            const res = await request(app)
                .post('/api/analytics')
                .set('Authorization', `Bearer ${reg.body.token}`)
                .send({ eventType: 'screen_view', screen: 'Settings' });
            expect(res.status).toBe(201);
        });
    });
});
