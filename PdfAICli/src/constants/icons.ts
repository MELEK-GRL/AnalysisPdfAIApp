/**
 * App genelinde standart ikon boyutları.
 * Text scale ile orantılı: body ~14px → iconMedium ~22px
 */
export const iconSize = {
    /** 16px – Küçük inline ikonlar */
    small: 16,
    /** 20px – Liste, tab bar ikonları */
    medium: 20,
    /** 24px – Header, buton ikonları */
    large: 24,
    /** 28px – Settings back, büyük navigasyon */
    xl: 28,
    /** 48px – Empty state, vurgu ikonları */
    xxl: 48,
} as const;

export type IconSizeKey = keyof typeof iconSize;
