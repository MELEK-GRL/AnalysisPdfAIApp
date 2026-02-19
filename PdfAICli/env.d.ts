declare module '@env' {
    export const API_BASE_URL: string;
}

declare module '*.json' {
    const value: Record<string, unknown>;
    export default value;
}
