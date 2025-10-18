const mongoose = require('mongoose');

const ConsentSchema = new mongoose.Schema({
    // Kullanıcı login olmadan da onay verebilir → user optional
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: false },

    // Cihaz/kurulum kimliği: client’ın ürettiği installationId (UUID)
    installationId: { type: String, index: true, required: true },

    consentGiven: { type: Boolean, default: true }, // ileride revoke edilebilir
    termsVersion: { type: String, required: true }, // ör: "v1.0.3" veya metnin sha256’ı
    method: { type: String, default: 'checkbox' }, // checkbox / modal / link

    ip: { type: String },
    userAgent: { type: String },

    // İsteğe bağlı cihaz/app bilgileri (fazlası kişisel veri olabilir, ölçülü tut)
    device: {
        platform: String,         // iOS / Android
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
