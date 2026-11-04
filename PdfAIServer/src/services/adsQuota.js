const LabHistory = require('../models/LabHistory');
const AnalysisUsage = require('../models/AnalysisUsage');
const BonusCredit = require('../models/BonusCredit');
const AdWatchProgress = require('../models/AdWatchProgress');
const {
    RATE_LIMIT_ANALYSIS_WINDOW_MS,
    RATE_LIMIT_ANALYSIS_MAX,
    RATE_LIMIT_ANALYSIS_DISABLED,
    isAdsEnabled,
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

/**
 * LabHistory satırlarından AnalysisUsage oluşturur (geçmiş silinmeden önce / kota okunurken).
 * Geçmiş silinse bile kota tüketimi korunur.
 */
async function ensureUsageFromHistoryDocs(userId, historyDocs) {
    if (!historyDocs?.length) return;
    const ids = historyDocs.map((h) => h._id).filter(Boolean);
    if (!ids.length) return;

    const existing = await AnalysisUsage.find({
        user: userId,
        sourceHistoryId: { $in: ids },
    })
        .select('sourceHistoryId')
        .lean();
    const have = new Set(existing.map((e) => String(e.sourceHistoryId)));
    const missing = historyDocs.filter((h) => h._id && !have.has(String(h._id)));
    if (!missing.length) return;

    try {
        await AnalysisUsage.insertMany(
            missing.map((h) => ({
                user: userId,
                sourceHistoryId: h._id,
                createdAt: h.createdAt || new Date(),
                updatedAt: h.createdAt || new Date(),
            })),
            { ordered: false }
        );
    } catch (e) {
        // duplicate key (yarış) — yok say
        if (e?.code !== 11000) throw e;
    }
}

/** Silinecek geçmiş kayıtları için kullanım satırlarını önce yazar. */
async function preserveUsageForHistoryFilter(userId, filter) {
    if (RATE_LIMIT_ANALYSIS_DISABLED) return;
    const docs = await LabHistory.find(filter).select('_id createdAt').lean();
    await ensureUsageFromHistoryDocs(userId, docs);
}

async function backfillUsageFromHistory(userId, since = windowStart()) {
    const docs = await LabHistory.find({
        user: userId,
        createdAt: { $gte: since },
    })
        .select('_id createdAt')
        .lean();
    await ensureUsageFromHistoryDocs(userId, docs);
}

async function recordAnalysisUsage(userId, sourceHistoryId = null) {
    if (RATE_LIMIT_ANALYSIS_DISABLED) return null;
    try {
        return await AnalysisUsage.create({
            user: userId,
            sourceHistoryId: sourceHistoryId || null,
        });
    } catch (e) {
        if (e?.code === 11000 && sourceHistoryId) {
            return AnalysisUsage.findOne({ user: userId, sourceHistoryId });
        }
        throw e;
    }
}

async function countAnalysesInWindow(userId, since = windowStart()) {
    await backfillUsageFromHistory(userId, since);
    return AnalysisUsage.countDocuments({
        user: userId,
        createdAt: { $gte: since },
    });
}

async function getQuotaForUser(userId) {
    if (RATE_LIMIT_ANALYSIS_DISABLED) {
        return {
            adsEnabled: isAdsEnabled(),
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
    // Kalan = (baz haktan kalan) + kullanılmamış reklam bonusları.
    // Önceden limit kapalıyken yapılan fazla analizlerde bile +1 bonus 1 sorgu hakkı verir.
    const baseRemaining = Math.max(0, RATE_LIMIT_ANALYSIS_MAX - analysesUsed);
    const remaining = baseRemaining + bonusUnused;
    const allowed = analysesUsed + remaining;

    return {
        adsEnabled: isAdsEnabled(),
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
    if (quota.remaining <= 0) {
        return { ok: false, usedBonus: false, quota };
    }
    // Baz hak (2) dolduysa bu analiz bir bonus hakkını tüketir
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
    if (!isAdsEnabled()) {
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
    recordAnalysisUsage,
    preserveUsageForHistoryFilter,
};
