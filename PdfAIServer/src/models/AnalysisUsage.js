const mongoose = require('mongoose');
const { RATE_LIMIT_ANALYSIS_WINDOW_MS } = require('../constants');

/**
 * Analiz kotası tüketimi — LabHistory silinse bile 24s penceresinde sayılır.
 * TTL: pencerenin ~2 katı sonra otomatik temizlenir.
 */
const AnalysisUsageSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        /** Kaynak geçmiş kaydı (varsa); silindikten sonra da kullanım satırı kalır. */
        sourceHistoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LabHistory',
            default: null,
        },
    },
    { timestamps: true }
);

AnalysisUsageSchema.index({ user: 1, createdAt: -1 });
AnalysisUsageSchema.index(
    { sourceHistoryId: 1 },
    { unique: true, partialFilterExpression: { sourceHistoryId: { $type: 'objectId' } } }
);
AnalysisUsageSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: Math.ceil((RATE_LIMIT_ANALYSIS_WINDOW_MS * 2) / 1000) }
);

module.exports =
    mongoose.models.AnalysisUsage ||
    mongoose.model('AnalysisUsage', AnalysisUsageSchema);
