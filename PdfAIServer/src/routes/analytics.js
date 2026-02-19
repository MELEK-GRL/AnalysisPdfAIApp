const express = require('express');
const AppAnalytics = require('../models/AppAnalytics');
const { VALID_ANALYTICS_TYPES } = require('../constants');
const router = express.Router();

/**
 * POST /api/analytics
 * Body: { eventType, screen?, buttonId?, durationSeconds?, metadata?, installationId?, platform? }
 * Auth: Optional – token varsa user ilişkilendirilir
 */
router.post('/', async (req, res) => {
    try {
        const {
            eventType,
            screen,
            buttonId,
            durationSeconds,
            metadata,
            installationId,
            platform,
        } = req.body;

        if (!eventType || !VALID_ANALYTICS_TYPES.includes(eventType)) {
            return res.status(400).json({
                message: 'Geçersiz eventType. Geçerli: screen_view, button_click, login, event',
            });
        }

        const doc = {
            eventType,
            screen: typeof screen === 'string' ? screen.trim() || null : null,
            buttonId: typeof buttonId === 'string' ? buttonId.trim() || null : null,
            durationSeconds:
                typeof durationSeconds === 'number' && durationSeconds >= 0
                    ? durationSeconds
                    : null,
            metadata: typeof metadata === 'object' && metadata !== null ? metadata : {},
            user: req.user?._id || null,
            installationId: typeof installationId === 'string' ? installationId.trim() || null : null,
            platform: typeof platform === 'string' ? platform.trim() || null : null,
        };

        await AppAnalytics.create(doc);
        return res.status(201).json({ ok: true });
    } catch (e) {
        console.error('ANALYTICS POST ERR:', e?.message || e);
        return res.status(500).json({ message: 'Analytics kaydedilemedi', detail: e?.message });
    }
});

module.exports = router;
