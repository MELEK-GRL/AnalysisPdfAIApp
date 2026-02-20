const request = require('supertest');
const app = require('../src/app');

describe('Analytics', () => {
    let authToken;

    beforeEach(async () => {
        const reg = await request(app)
            .post('/api/auth/register')
            .send({ name: 'AnalyticsUser', email: `analytics-${Date.now()}@example.com`, password: '123456', termsAccepted: true });
        authToken = reg.body.token;
    });

    const postAnalytics = (body, token = authToken) =>
        request(app)
            .post('/api/analytics')
            .set('Authorization', `Bearer ${token}`)
            .send(body);

    describe('POST /api/analytics', () => {
        it('token olmadan 401 döner', async () => {
            const res = await request(app).post('/api/analytics').send({ eventType: 'screen_view' });
            expect(res.status).toBe(401);
        });

        it('eventType olmadan 400 döner', async () => {
            const res = await postAnalytics({});
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/eventType|Geçersiz/);
        });

        it('geçersiz eventType ile 400 döner', async () => {
            const res = await postAnalytics({ eventType: 'invalid_type' });
            expect(res.status).toBe(400);
        });

        it('screen_view ile 201 döner', async () => {
            const res = await postAnalytics({ eventType: 'screen_view', screen: 'Home' });
            expect(res.status).toBe(201);
            expect(res.body).toEqual({ ok: true });
        });

        it('button_click ile 201 döner', async () => {
            const res = await postAnalytics({ eventType: 'button_click', buttonId: 'upload_btn', screen: 'Home' });
            expect(res.status).toBe(201);
        });

        it('login eventType ile 201 döner', async () => {
            const res = await postAnalytics({ eventType: 'login' });
            expect(res.status).toBe(201);
        });

        it('event eventType ile 201 döner', async () => {
            const res = await postAnalytics({ eventType: 'event', metadata: { key: 'value' } });
            expect(res.status).toBe(201);
        });

        it('user ilişkilendirilir (requireAuth)', async () => {
            const res = await postAnalytics({ eventType: 'screen_view', screen: 'Settings' });
            expect(res.status).toBe(201);
        });
    });
});
