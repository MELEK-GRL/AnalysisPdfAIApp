/**
 * App genelinde tek yerden kontrol edilen tipografi standartları.
 * Tüm text boyutları bu constants'tan beslenir.
 */
export const fontSize = {
    /** 12px – Küçük etiketler, secondary bilgi */
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

export type FontSizeKey = keyof typeof fontSize;
