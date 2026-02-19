const request = require('supertest');
const app = require('../src/app');

describe('Auth', () => {
    describe('POST /api/auth/register', () => {
        it('eksik alanlarda 400 döner', async () => {
            const res = await request(app).post('/api/auth/register').send({});
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Missing fields');
        });

        it('geçerli isim, email, şifre ile kullanıcı oluşturur', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'TestUser', email: 'test@example.com', password: '123456' });
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user).toEqual(expect.objectContaining({
                name: 'TestUser',
                email: 'test@example.com',
            }));
        });

        it('aynı email ile 409 döner', async () => {
            await request(app)
                .post('/api/auth/register')
                .send({ name: 'User1', email: 'dup@example.com', password: '123456' });
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'User2', email: 'dup@example.com', password: '654321' });
            expect(res.status).toBe(409);
            expect(res.body.message).toBe('Email in use');
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await request(app)
                .post('/api/auth/register')
                .send({ name: 'LoginUser', email: 'login@example.com', password: 'secret123' });
        });

        it('eksik credentials ile 400 döner', async () => {
            const res = await request(app).post('/api/auth/login').send({});
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Missing credentials');
        });

        it('email ile giriş yapar', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ identifier: 'login@example.com', password: 'secret123' });
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user.email).toBe('login@example.com');
        });

        it('name ile giriş yapar', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ identifier: 'LoginUser', password: 'secret123' });
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
        });

        it('yanlış şifre ile 401 döner', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ identifier: 'login@example.com', password: 'wrong' });
            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Invalid credentials');
        });

        it('olmayan kullanıcı ile 401 döner', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ identifier: 'nonexistent@x.com', password: 'any' });
            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/auth/me', () => {
        it('token olmadan 401 döner', async () => {
            const res = await request(app).get('/api/auth/me');
            expect(res.status).toBe(401);
        });

        it('geçerli token ile kullanıcı döner', async () => {
            const reg = await request(app)
                .post('/api/auth/register')
                .send({ name: 'MeUser', email: 'me@example.com', password: '123456' });
            const token = reg.body.token;
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body.user.email).toBe('me@example.com');
        });
    });
});
