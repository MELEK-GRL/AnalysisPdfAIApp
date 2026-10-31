const mongoose = require('mongoose');

/** Kullanıcı başına kısmi reklam sayacı (0 veya 1). 2. reklamda sıfırlanır, BonusCredit oluşur. */
const AdWatchProgressSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
        pendingWatches: { type: Number, default: 0, min: 0, max: 1 },
        lastWatchAt: { type: Date, default: null },
    },
    { timestamps: true }
);

module.exports =
    mongoose.models.AdWatchProgress ||
    mongoose.model('AdWatchProgress', AdWatchProgressSchema);
