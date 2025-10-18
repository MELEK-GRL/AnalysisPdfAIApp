const mongoose = require('mongoose');

const DeviceSessionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    installationIdHash: { type: String, index: true },

    device: {
        platform: String,
        osVersion: String,
        appVersion: String,
        buildNumber: String,
        deviceModel: String,
        manufacturer: String,
        locale: String,
    },

    ip: String,
    userAgent: String,

    createdAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    revokedAt: { type: Date, default: null },
});

module.exports = mongoose.model('DeviceSession', DeviceSessionSchema);
