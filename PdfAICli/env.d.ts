declare module '@env' {
    export const API_BASE_URL: string;
    /** Canlıda zorunlu: Gizlilik politikası sayfası URL'i (Play Store). */
    export const PRIVACY_POLICY_URL: string | undefined;
}

declare module '*.json' {
    const value: Record<string, unknown>;
    export default value;
}
