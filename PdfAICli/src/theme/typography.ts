/**
 * Global tipografi: font ailesi, base boyutlar, satır yükseklikleri.
 * Ekran boyutuna göre ölçekleme useTypography() ile yapılır.
 */

/** Tasarım referansı: 375pt genişlik (useDeviceStore ile uyumlu) */
export const BASE_DESIGN_WIDTH = 375;

/** Font ölçek faktörü sınırları: çok küçük/büyük ekranlarda aşırı büyüme/küçülme engellenir */
export const FONT_SCALE_MIN = 0.9;
export const FONT_SCALE_MAX = 1.2;

/** Proje geneli yazı boyutu çarpanı (1 = mevcut, 0.88 = %12 küçük). Tüm font boyutları buna göre küçülür/büyür. */
export const FONT_SIZE_MULTIPLIER = 0.88;

/** Uygulama genelinde kullanılacak font ailesi. Özel font yüklenecekse buradan değiştirilir. */
export const fontFamily = 'System';

/** Base font boyutları (375pt referans ekranda). Ölçek useTypography ile uygulanır. */
export const baseFontSize = {
    /** 12px – Küçük etiketler, tab label, secondary bilgi */
    caption: 12,
    /** 13px – Tarih, meta bilgiler */
    captionLarge: 13,
    /** 14px – Tab label, küçük buton metni */
    label: 14,
    /** 15px – İkincil body metin */
    bodySmall: 15,
    /** 16px – Ana body metin (varsayılan) */
    body: 16,
    /** 17px – Liste öğe başlıkları */
    bodyMedium: 17,
    /** 18px – Alt başlık, form label, buton metni */
    subtitle: 18,
    /** 19px – Form input vurgu */
    subtitleLarge: 19,
    /** 20px – Ekran alt başlıkları */
    title: 20,
    /** 22px – Ekran başlıkları, header */
    titleLarge: 22,
    /** 24px – Modal başlık */
    titleXl: 24,
    /** 26px – Ana ekran başlıkları (Settings, Splash vb.) */
    display: 26,
} as const;

/** Her rol için satır yüksekliği çarpanı (fontSize * lineHeight = lineHeight px). Okunaklılık için. */
export const baseLineHeight: Record<keyof typeof baseFontSize, number> = {
    caption: 1.33,
    captionLarge: 1.38,
    label: 1.36,
    bodySmall: 1.4,
    body: 1.44,
    bodyMedium: 1.41,
    subtitle: 1.33,
    subtitleLarge: 1.37,
    title: 1.3,
    titleLarge: 1.27,
    titleXl: 1.25,
    display: 1.23,
};

export type FontSizeKey = keyof typeof baseFontSize;

/** Verilen ölçek faktörüne göre tüm boyutları hesaplar (scale zaten FONT_SIZE_MULTIPLIER içerir). */
export function getScaledSizes(scaleFactor: number): Record<FontSizeKey, number> {
    const keys = Object.keys(baseFontSize) as FontSizeKey[];
    const result = {} as Record<FontSizeKey, number>;
    for (const key of keys) {
        result[key] = Math.round(baseFontSize[key] * scaleFactor);
    }
    return result;
}

/** Ölçek faktörünü FONT_SCALE_MIN / FONT_SCALE_MAX ile sınırlar. */
export function clampFontScale(scale: number): number {
    return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, scale));
}
