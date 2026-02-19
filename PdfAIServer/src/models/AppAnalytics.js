const mongoose = require('mongoose');

const AppAnalyticsSchema = new mongoose.Schema(
    {
        eventType: {
            type: String,
            required: true,
            enum: ['screen_view', 'button_click', 'login', 'event'],
            index: true,
        },
        screen: { type: String, default: null, trim: true },
        buttonId: { type: String, default: null, trim: true },
        durationSeconds: { type: Number, default: null },
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
        installationId: { type: String, default: null, trim: true, index: true },
        platform: { type: String, default: null, trim: true },
    },
    { timestamps: true, strict: true }
);

AppAnalyticsSchema.index({ createdAt: -1 });
AppAnalyticsSchema.index({ eventType: 1, createdAt: -1 });

module.exports =
    mongoose.models.AppAnalytics ||
    mongoose.model('AppAnalytics', AppAnalyticsSchema);
