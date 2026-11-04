const path = require('path');

/** 24 saatlik pencerede kullanıcı başına maksimum PDF analizi */
const RATE_LIMIT_ANALYSIS_WINDOW_MS = 24 * 60 * 60 * 1000;

/** 24 saatte izin verilen analiz sayısı (UAT ve PROD'da; DEV'de limit yok) */
const RATE_LIMIT_ANALYSIS_MAX = 2;

/**
 * Sadece DEV ortamında günlük analiz limiti kapalı; UAT ve PROD'da 2/24h zorunlu.
 * DEV: APP_ENV=dev veya (APP_ENV set değil ve NODE_ENV=development).
 */
function isDevEnvironment() {
    const appEnv = process.env.APP_ENV;
    if (appEnv === 'dev') return true;
    if (appEnv != null && appEnv !== '') return false; // uat, prod, staging → limit açık
    return process.env.NODE_ENV === 'development';
}

/** DEV'de limit kapalı; UAT/PROD'da açık (2 analiz/24h). */
const RATE_LIMIT_ANALYSIS_DISABLED = isDevEnvironment();

/**
 * AdMob: 2 rewarded → +1 analiz hakkı.
 * Aç/kapa sadece sunucu (ADS_ENABLED). Client rebuild gerekmez.
 * Kota hesabı sunucu saatiyle.
 */
const ADS_ENABLED = String(process.env.ADS_ENABLED || '').toLowerCase() === 'true';
const ADS_WATCHES_PER_CREDIT = Math.max(1, Number(process.env.ADS_WATCHES_PER_CREDIT) || 2);

/**
 * OpenAI LLM çağrıları. Aç/kapa sadece sunucu (OPENAI_ENABLED).
 * Varsayılan: açık. Token bitince OPENAI_ENABLED=false → regex + lokal yorum (API isteği yok).
 * Client rebuild gerekmez; env değişince process restart yeter.
 */
const OPENAI_ENABLED = String(process.env.OPENAI_ENABLED ?? 'true').toLowerCase() !== 'false';
/** Boşsa Google test rewarded unit (canlıda gerçek unit koy). */
const ADMOB_REWARDED_UNIT_ID =
    (process.env.ADMOB_REWARDED_UNIT_ID || '').trim() ||
    'ca-app-pub-3940256099942544/5224354917';

/** Geçici dosyalar için dizin */
const TMP_DIR = path.join(__dirname, '..', 'tmp');

/** Varsayılan server portu */
const DEFAULT_PORT = 4000;

/** Varsayılan MongoDB veritabanı adı (küçük harf – Atlas büyük/küçük harf duyarlı) */
const DEFAULT_DB_NAME = 'analysispdf';

/** JWT token süresi */
const JWT_EXPIRES_IN = '7d';

/** bcrypt hash rounds */
const BCRYPT_ROUNDS = 10;

/** Maksimum yükleme boyutu (15 MB) */
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

/** Geçerli analytics event tipleri */
const VALID_ANALYTICS_TYPES = ['screen_view', 'button_click', 'login', 'event'];

/** Health check yanıtı */
const EARLY_OK = 'EARLY_OK';

/** Kullanıcı başına geçmişte tutulacak maksimum tahlil analizi sayısı (en güncel N kayıt) */
const MAX_LAB_HISTORY_PER_USER = 30;

module.exports = {
    RATE_LIMIT_ANALYSIS_WINDOW_MS,
    RATE_LIMIT_ANALYSIS_MAX,
    RATE_LIMIT_ANALYSIS_DISABLED,
    isDevEnvironment,
    ADS_ENABLED,
    ADS_WATCHES_PER_CREDIT,
    ADMOB_REWARDED_UNIT_ID,
    OPENAI_ENABLED,
    TMP_DIR,
    DEFAULT_PORT,
    DEFAULT_DB_NAME,
    JWT_EXPIRES_IN,
    BCRYPT_ROUNDS,
    MAX_UPLOAD_BYTES,
    VALID_ANALYTICS_TYPES,
    EARLY_OK,
    MAX_LAB_HISTORY_PER_USER,
};
