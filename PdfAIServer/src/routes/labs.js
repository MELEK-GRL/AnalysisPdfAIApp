const express = require('express');
const mongoose = require('mongoose');
const LatestLabResult = require('../models/LatestLabResult');
const LabHistory = require('../models/LabHistory');
const { normalizeItemsSections } = require('../utils/normalizeSection');
const { compareLabItems } = require('../utils/labCompare');
const { finalizeLabItems } = require('../services/openai');
const { preserveUsageForHistoryFilter } = require('../services/adsQuota');
const router = express.Router();

function cleanLabItems(items) {
    return finalizeLabItems(normalizeItemsSections(items || []));
}

router.get('/history', async (req, res) => {
    try {
        const docs = await LabHistory.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .select('items analysis pdfName createdAt')
            .lean();

        const items = docs.map((d) => {
            const cleaned = cleanLabItems(d.items);
            return {
                id: d._id.toString(),
                pdfName: d.pdfName || null,
                createdAt: d.createdAt,
                itemCount: cleaned.length,
                analysis: d.analysis || null,
            };
        });

        return res.json({ items });
    } catch (e) {
        console.error('LABS/HISTORY ERR:', e?.message || e);
        return res.status(500).json({ message: 'Geçmiş alınamadı', detail: e?.message });
    }
});

router.delete('/history', async (req, res) => {
    try {
        const filter = { user: req.user._id };
        await preserveUsageForHistoryFilter(req.user._id, filter);
        const result = await LabHistory.deleteMany(filter);
        return res.json({ success: true, deletedCount: result.deletedCount });
    } catch (e) {
        console.error('LABS/HISTORY DELETE ALL ERR:', e?.message || e);
        return res.status(500).json({ message: 'Geçmiş silinemedi', detail: e?.message });
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
            items: cleanLabItems(doc.items),
            analysis: doc.analysis || null,
            patientName: doc.patientName || null,
        });
    } catch (e) {
        console.error('LABS/HISTORY/:id ERR:', e?.message || e);
        return res.status(500).json({ message: 'Kayıt alınamadı', detail: e?.message });
    }
});

router.delete('/history/:id', async (req, res) => {
    try {
        const filter = {
            _id: req.params.id,
            user: req.user._id,
        };
        await preserveUsageForHistoryFilter(req.user._id, filter);
        const result = await LabHistory.findOneAndDelete(filter);
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
        return res.json({ items: cleanLabItems(doc.items), updatedAt: doc.updatedAt });
    } catch (e) {
        console.error('LABS/LATEST ERR:', e?.message || e);
        return res.status(500).json({ message: 'Labs fetch error', detail: e?.message });
    }
});

/**
 * POST /api/labs/compare
 * Body: { id1, id2 } — kullanıcı seçim sırası korunur.
 * AI yok; yalnızca kullanıcının kendi kayıtları + JS karşılaştırma.
 */
router.post('/compare', async (req, res) => {
    try {
        const id1 = req.body?.id1 != null ? String(req.body.id1).trim() : '';
        const id2 = req.body?.id2 != null ? String(req.body.id2).trim() : '';

        if (!id1 || !id2) {
            return res.status(400).json({ message: 'id1 ve id2 gerekli' });
        }
        if (id1 === id2) {
            return res.status(400).json({ message: 'Aynı tahlil iki kez seçilemez' });
        }
        if (!mongoose.Types.ObjectId.isValid(id1) || !mongoose.Types.ObjectId.isValid(id2)) {
            return res.status(400).json({ message: 'Geçersiz kayıt kimliği' });
        }

        const userId = req.user._id;
        const [doc1, doc2] = await Promise.all([
            LabHistory.findOne({ _id: id1, user: userId }).lean(),
            LabHistory.findOne({ _id: id2, user: userId }).lean(),
        ]);

        if (!doc1 || !doc2) {
            return res.status(404).json({
                message: 'Seçilen tahlillerden biri bulunamadı veya size ait değil',
            });
        }

        const comparison = compareLabItems(
            cleanLabItems(doc1.items),
            cleanLabItems(doc2.items),
            {
                id1: doc1._id.toString(),
                id2: doc2._id.toString(),
                createdAt1: doc1.createdAt,
                createdAt2: doc2.createdAt,
                pdfName1: doc1.pdfName || null,
                pdfName2: doc2.pdfName || null,
            },
        );

        return res.json({ comparison });
    } catch (e) {
        console.error('LABS/COMPARE ERR:', e?.message || e);
        return res.status(500).json({ message: 'Karşılaştırma yapılamadı', detail: e?.message });
    }
});

module.exports = router;
