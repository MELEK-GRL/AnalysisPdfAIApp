const express = require('express');
const LatestLabResult = require('../models/LatestLabResult');
const LabHistory = require('../models/LabHistory');
const router = express.Router();

router.get('/history', async (req, res) => {
    try {
        const docs = await LabHistory.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .select('items analysis pdfName createdAt')
            .lean();

        const items = docs.map((d) => ({
            id: d._id.toString(),
            pdfName: d.pdfName || null,
            createdAt: d.createdAt,
            itemCount: Array.isArray(d.items) ? d.items.length : 0,
            analysis: d.analysis || null,
        }));

        return res.json({ items });
    } catch (e) {
        console.error('LABS/HISTORY ERR:', e?.message || e);
        return res.status(500).json({ message: 'Geçmiş alınamadı', detail: e?.message });
    }
});

router.get('/history/:id', async (req, res) => {
    try {
        const doc = await LabHistory.findOne({
            _id: req.params.id,
            user: req.user._id,
        }).lean();

        if (!doc) return res.status(404).json({ message: 'Kayıt bulunamadı' });

        return res.json({
            id: doc._id.toString(),
            pdfName: doc.pdfName || null,
            createdAt: doc.createdAt,
            items: doc.items || [],
            analysis: doc.analysis || null,
        });
    } catch (e) {
        console.error('LABS/HISTORY/:id ERR:', e?.message || e);
        return res.status(500).json({ message: 'Kayıt alınamadı', detail: e?.message });
    }
});

router.delete('/history/:id', async (req, res) => {
    try {
        const result = await LabHistory.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id,
        });
        if (!result) {
            return res.status(404).json({ message: 'Kayıt bulunamadı' });
        }
        return res.json({ success: true });
    } catch (e) {
        console.error('LABS/HISTORY/:id DELETE ERR:', e?.message || e);
        return res.status(500).json({ message: 'Kayıt silinemedi', detail: e?.message });
    }
});

router.get('/latest', async (req, res) => {
    try {
        const doc = await LatestLabResult.findOne({ user: req.user._id }).lean();
        if (!doc) {
            return res.json({ items: [], updatedAt: null });
        }
        return res.json({ items: doc.items || [], updatedAt: doc.updatedAt });
    } catch (e) {
        console.error('LABS/LATEST ERR:', e?.message || e);
        return res.status(500).json({ message: 'Labs fetch error', detail: e?.message });
    }
});

module.exports = router;
