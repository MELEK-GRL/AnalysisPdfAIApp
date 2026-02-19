/**
 * Test setup – MongoDB Memory Server, env vars.
 * openai.js OPENAI_API_KEY beklediği için test öncesi ayarlanmalı.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-tests';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-test-dummy-key';

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, { dbName: 'testdb' });
}, 30000);

afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const name of Object.keys(collections)) {
        await collections[name].deleteMany({});
    }
});
