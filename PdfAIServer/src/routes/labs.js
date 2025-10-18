const express = require('express');
const LatestLabResult = require('../models/LatestLabResult');
const router = express.Router();

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
