const LabHistory = require('../models/LabHistory');
const BonusCredit = require('../models/BonusCredit');
const AdWatchProgress = require('../models/AdWatchProgress');
const {
    RATE_LIMIT_ANALYSIS_WINDOW_MS,
    RATE_LIMIT_ANALYSIS_MAX,
    RATE_LIMIT_ANALYSIS_DISABLED,
    ADS_ENABLED,
    ADS_WATCHES_PER_CREDIT,
} = require('../constants');

function windowStart(now = Date.now()) {
    return new Date(now - RATE_LIMIT_ANALYSIS_WINDOW_MS);
}

async function countUnusedBonusCredits(userId, since = windowStart()) {
    return BonusCredit.countDocuments({
        user: userId,
        createdAt: { $gte: since },
        consumedAt: null,
    });
}

async function countAnalysesInWindow(userId, since = windowStart()) {
    return LabHistory.countDocuments({
        user: userId,
        createdAt: { $gte: since },
    });
}

async function getQuotaForUser(userId) {
    if (RATE_LIMIT_ANALYSIS_DISABLED) {
        return {
            adsEnabled: ADS_ENABLED,
            limitDisabled: true,
            windowMs: RATE_LIMIT_ANALYSIS_WINDOW_MS,
            baseLimit: RATE_LIMIT_ANALYSIS_MAX,
            analysesUsed: 0,
            bonusUnused: 0,
            allowed: Number.MAX_SAFE_INTEGER,
            remaining: Number.MAX_SAFE_INTEGER,
            pendingAdWatches: 0,
            adsNeededForNextCredit: ADS_WATCHES_PER_CREDIT,
        };
    }

    const since = windowStart();
    const [analysesUsed, bonusUnused, progress] = await Promise.all([
        countAnalysesInWindow(userId, since),
        countUnusedBonusCredits(userId, since),
        AdWatchProgress.findOne({ user: userId }).lean(),
    ]);

    const pendingAdWatches = Math.min(
        ADS_WATCHES_PER_CREDIT - 1,
        Math.max(0, progress?.pendingWatches || 0)
    );
    const allowed = RATE_LIMIT_ANALYSIS_MAX + bonusUnused;
    const remaining = Math.max(0, allowed - analysesUsed);

    return {
        adsEnabled: ADS_ENABLED,
        limitDisabled: false,
        windowMs: RATE_LIMIT_ANALYSIS_WINDOW_MS,
        baseLimit: RATE_LIMIT_ANALYSIS_MAX,
        analysesUsed,
        bonusUnused,
        allowed,
        remaining,
        pendingAdWatches,
        adsNeededForNextCredit: Math.max(0, ADS_WATCHES_PER_CREDIT - pendingAdWatches),
    };
}

async function assertCanAnalyze(userId) {
    if (RATE_LIMIT_ANALYSIS_DISABLED) {
        return { ok: true, usedBonus: false, quota: await getQuotaForUser(userId) };
    }
    const quota = await getQuotaForUser(userId);
    if (quota.analysesUsed >= quota.allowed) {
        return { ok: false, usedBonus: false, quota };
    }
    const usedBonus = quota.analysesUsed >= RATE_LIMIT_ANALYSIS_MAX;
    return { ok: true, usedBonus, quota };
}

async function consumeBonusIfNeeded(userId, usedBonus) {
    if (!usedBonus || RATE_LIMIT_ANALYSIS_DISABLED) return null;
    const since = windowStart();
    return BonusCredit.findOneAndUpdate(
        {
            user: userId,
            createdAt: { $gte: since },
            consumedAt: null,
        },
        { $set: { consumedAt: new Date() } },
        { sort: { createdAt: 1 }, new: true }
    );
}

async function recordAdWatch(userId) {
    if (!ADS_ENABLED) {
        const err = new Error('Ads disabled');
        err.code = 'ADS_DISABLED';
        err.status = 403;
        throw err;
    }

    const progress = await AdWatchProgress.findOne({ user: userId });
    if (progress?.lastWatchAt) {
        const elapsed = Date.now() - new Date(progress.lastWatchAt).getTime();
        if (elapsed < 10_000) {
            const err = new Error('Too many ad reward requests');
            err.code = 'ADS_RATE_LIMIT';
            err.status = 429;
            throw err;
        }
    }

    const doc = await AdWatchProgress.findOneAndUpdate(
        { user: userId },
        {
            $setOnInsert: { user: userId },
            $set: { lastWatchAt: new Date() },
        },
        { upsert: true, new: true }
    );

    const nextPending = (doc.pendingWatches || 0) + 1;

    if (nextPending >= ADS_WATCHES_PER_CREDIT) {
        await BonusCredit.create({ user: userId });
        doc.pendingWatches = 0;
        await doc.save();
        return {
            creditGranted: true,
            pendingAdWatches: 0,
            adsNeededForNextCredit: ADS_WATCHES_PER_CREDIT,
            quota: await getQuotaForUser(userId),
        };
    }

    doc.pendingWatches = nextPending;
    await doc.save();
    return {
        creditGranted: false,
        pendingAdWatches: nextPending,
        adsNeededForNextCredit: ADS_WATCHES_PER_CREDIT - nextPending,
        quota: await getQuotaForUser(userId),
    };
}

module.exports = {
    getQuotaForUser,
    assertCanAnalyze,
    consumeBonusIfNeeded,
    recordAdWatch,
};
