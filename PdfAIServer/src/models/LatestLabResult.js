const mongoose = require('mongoose');

const LabItemSchema = new mongoose.Schema({
    test: { type: String, required: true, trim: true },
    label: { type: String, default: null },
    value: { type: Number, required: true },
    unit: { type: String, default: null },
    refLow: { type: Number, default: null },
    refHigh: { type: Number, default: null },
    flag: { type: String, enum: ['L', 'N', 'H'], default: 'N' },
}, { _id: false });

const LatestLabResultSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
        items: { type: [LabItemSchema], default: [] },
        analysis: { type: String, default: null },
    },
    { timestamps: true, strict: true }
);


module.exports =
    mongoose.models.LatestLabResult ||
    mongoose.model('LatestLabResult', LatestLabResultSchema);
