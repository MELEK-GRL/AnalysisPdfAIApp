/** İstek/limit sabitleri (tek yerden yönetim) */

/** Günlük PDF analiz hakkı (backend ile uyumlu) */
export const DAILY_ANALYSIS_LIMIT = 2;

/** Kullanıcı başına saklanan maksimum analiz geçmişi (backend MAX_LAB_HISTORY_PER_USER ile uyumlu) */
export const MAX_LAB_HISTORY_PER_USER = 30;

/** +1 hak için izlenmesi gereken rewarded sayısı */
export const ADS_WATCHES_PER_CREDIT = 2;

/**
 * Fallback rewarded unit (sunucu unit göndermezse).
 * Aç/kapa ve asıl unit ID sunucudan gelir.
 */
export const TEST_REWARDED_UNIT_ID = 'ca-app-pub-3940256099942544/5224354917';

/** Ön planda hareketsizlik sonrası otomatik çıkış süresi (ms). Arka plana geçişte hemen logout. */
export const SESSION_TIMEOUT_MS = 20 * 60 * 1000;

/** Hareketsizlik kontrolü aralığı (ms) */
export const SESSION_CHECK_INTERVAL_MS = 60 * 1000;
