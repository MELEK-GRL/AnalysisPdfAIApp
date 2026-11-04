const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const {
    isAdsEnabled,
    ADS_WATCHES_PER_CREDIT,
    ADMOB_REWARDED_UNIT_ID,
    isOpenAIEnabled,
} = require('../constants');
const { getQuotaForUser, recordAdWatch } = require('../services/adsQuota');

const router = express.Router();

router.get('/status', requireAuth, async (req, res) => {
    try {
        const quota = await getQuotaForUser(req.user._id);
        const adsOn = isAdsEnabled();
        return res.json({
            ok: true,
            adsEnabled: adsOn,
            openaiEnabled: isOpenAIEnabled(),
            openaiEnabledRaw: process.env.OPENAI_ENABLED ?? null,
            watchesPerCredit: ADS_WATCHES_PER_CREDIT,
            rewardedUnitId: adsOn ? ADMOB_REWARDED_UNIT_ID : null,
            ...quota,
        });
    } catch (e) {
        return res.status(500).json({ message: 'Ads status failed', detail: e?.message });
    }
});

/**
 * Rewarded reklam tamamlandı.
 * Client timestamp kabul edilmez; kayıt sunucu Date ile.
 */
router.post('/reward', requireAuth, async (req, res) => {
    try {
        if (!isAdsEnabled()) {
            return res.status(403).json({
                message: 'Reklam ödülleri şu an kapalı.',
                code: 'ADS_DISABLED',
            });
        }
        const result = await recordAdWatch(req.user._id);
        return res.json({
            ok: true,
            creditGranted: result.creditGranted,
            pendingAdWatches: result.pendingAdWatches,
            adsNeededForNextCredit: result.adsNeededForNextCredit,
            quota: result.quota,
        });
    } catch (e) {
        const status = e.status || 500;
        return res.status(status).json({
            message: e.message || 'Ads reward failed',
            code: e.code || 'ADS_REWARD_FAILED',
        });
    }
});

module.exports = router;
