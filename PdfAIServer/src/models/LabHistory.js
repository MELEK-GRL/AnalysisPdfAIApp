const mongoose = require('mongoose');

const LabItemSchema = new mongoose.Schema({
    test: { type: String, required: true, trim: true },
    label: { type: String, default: null },
    value: { type: Number, required: true },
    unit: { type: String, default: null },
    refLow: { type: Number, default: null },
    refHigh: { type: Number, default: null },
    flag: { type: String, enum: ['L', 'N', 'H'], default: 'N' },
    resultLabel: { type: String, default: null },
}, { _id: false });

const LabHistorySchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        items: { type: [LabItemSchema], default: [] },
        analysis: { type: String, default: null },
        pdfName: { type: String, default: null, trim: true },
    },
    { timestamps: true, strict: true }
);

LabHistorySchema.index({ user: 1, createdAt: -1 });

module.exports =
    mongoose.models.LabHistory ||
    mongoose.model('LabHistory', LabHistorySchema);
