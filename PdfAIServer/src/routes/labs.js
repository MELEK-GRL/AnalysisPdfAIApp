// src/routes/labs.js
const express = require('express');
const LatestLabResult = require('../models/LatestLabResult'); // MODELİ routes içinde oluşturma, sadece kullan

const router = express.Router();

// GET /api/labs/latest  -> Son kayıt
router.get('/latest', async (req, res) => {
    try {
        if (!req.user?._id) return res.status(401).json({ message: 'Unauthorized' });

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
