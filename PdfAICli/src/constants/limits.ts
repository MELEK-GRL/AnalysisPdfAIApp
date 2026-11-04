/** İstek/limit sabitleri (tek yerden yönetim) */

/** Şifre uzunluğu (backend user model / auth ile uyumlu) */
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 8;

/** Günlük PDF analiz hakkı (backend ile uyumlu) */
export const DAILY_ANALYSIS_LIMIT = 1;

/** Kullanıcı başına saklanan maksimum analiz geçmişi (backend MAX_LAB_HISTORY_PER_USER ile uyumlu) */
export const MAX_LAB_HISTORY_PER_USER = 30;

/** +1 hak için izlenmesi gereken rewarded sayısı */
export const ADS_WATCHES_PER_CREDIT = 2;

/**
 * Fallback rewarded unit (sunucu unit göndermezse).
 * Aç/kapa ve asıl unit ID sunucudan gelir.
 */
export const TEST_REWARDED_UNIT_ID = 'ca-app-pub-3940256099942544/5224354917';

/** Ön planda hareketsizlik sonrası otomatik çıkış süresi (ms). */
export const SESSION_TIMEOUT_MS = 20 * 60 * 1000;

/**
 * Arka planda kalınca logout için bekleme (ms).
 * Anında logout PDF seçici / reklam / sistem UI yüzünden oturumu düşürüyordu.
 */
export const SESSION_BACKGROUND_GRACE_MS = 10 * 60 * 1000;

/** Hareketsizlik kontrolü aralığı (ms) */
export const SESSION_CHECK_INTERVAL_MS = 60 * 1000;
