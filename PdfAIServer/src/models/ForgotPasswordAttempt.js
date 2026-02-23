const mongoose = require('mongoose');

const FORGOT_PASSWORD_ATTEMPT_TTL_SEC = 24 * 60 * 60; // 24 saat sonra otomatik silinsin

const forgotPasswordAttemptSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, lowercase: true, trim: true },
    },
    { timestamps: true }
);

forgotPasswordAttemptSchema.index({ email: 1, createdAt: -1 });
forgotPasswordAttemptSchema.index({ createdAt: 1 }, { expireAfterSeconds: FORGOT_PASSWORD_ATTEMPT_TTL_SEC });

module.exports = mongoose.model('ForgotPasswordAttempt', forgotPasswordAttemptSchema);
