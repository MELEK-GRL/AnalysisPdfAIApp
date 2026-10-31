const mongoose = require('mongoose');

/**
 * Reklamdan kazanılan ekstra analiz hakkı.
 * createdAt = sunucu zamanı (cihaz saatine güvenilmez).
 */
const BonusCreditSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        consumedAt: { type: Date, default: null, index: true },
    },
    { timestamps: true }
);

BonusCreditSchema.index({ user: 1, createdAt: -1 });
BonusCreditSchema.index({ user: 1, consumedAt: 1, createdAt: 1 });

module.exports =
    mongoose.models.BonusCredit ||
    mongoose.model('BonusCredit', BonusCreditSchema);
