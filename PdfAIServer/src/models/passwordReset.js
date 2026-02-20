const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, lowercase: true, trim: true },
        token: { type: String, required: true },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
);

passwordResetSchema.index({ email: 1 });
passwordResetSchema.index({ token: 1 });
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
