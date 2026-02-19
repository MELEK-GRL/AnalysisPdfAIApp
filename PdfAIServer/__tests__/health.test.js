const request = require('supertest');
const app = require('../src/app');

describe('Health', () => {
    it('GET /health returns ok', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(expect.objectContaining({ ok: true, ts: expect.any(Number) }));
    });

    it('GET /__early returns EARLY_OK', async () => {
        const res = await request(app).get('/__early');
        expect(res.status).toBe(200);
        expect(res.type).toMatch(/text/);
        expect(res.text).toBe('EARLY_OK');
    });

    it('GET unknown path returns 404', async () => {
        const res = await request(app).get('/api/unknown');
        expect(res.status).toBe(404);
        expect(res.body).toEqual(expect.objectContaining({ message: 'Not found' }));
    });
});
