import { PRIVACY_POLICY_URL as ENV_PRIVACY_URL } from '@env';

/**
 * Play Store gereksinimi: Gizlilik politikası URL zorunludur.
 * .env / env-examples içinde PRIVACY_POLICY_URL tanımlayın (GitHub Pages veya hosting).
 * Canlı build öncesi mutlaka gerçek URL set edilmeli.
 */
export const PRIVACY_POLICY_URL = ENV_PRIVACY_URL && ENV_PRIVACY_URL.trim() !== ''
    ? ENV_PRIVACY_URL.trim()
    : 'https://example.com/privacy';
