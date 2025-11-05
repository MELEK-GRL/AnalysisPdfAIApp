const mongoose = require('mongoose');

const ConsentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: false },
    installationId: { type: String, index: true, required: true },

    consentGiven: { type: Boolean, default: true },
    termsVersion: { type: String, required: true },
    method: { type: String, default: 'checkbox' },

    ip: { type: String },
    userAgent: { type: String },

    device: {
        platform: String,
        osVersion: String,
        appVersion: String,
        buildNumber: String,
        deviceModel: String,
        manufacturer: String,
        locale: String,
    },

    createdAt: { type: Date, default: Date.now },
    revokedAt: { type: Date, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
});

module.exports = mongoose.model('Consent', ConsentSchema);


