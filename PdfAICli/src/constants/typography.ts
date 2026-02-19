/**
 * App genelinde tek yerden kontrol edilen tipografi standartları.
 * Tüm text boyutları bu constants'tan beslenir.
 */
export const fontSize = {
    /** 11px – Küçük etiketler, secondary bilgi */
    caption: 11,
    /** 12px – Tarih, meta bilgiler */
    captionLarge: 12,
    /** 13px – Tab label, küçük buton metni */
    label: 13,
    /** 14px – İkincil body metin */
    bodySmall: 14,
    /** 15px – Ana body metin (varsayılan) */
    body: 15,
    /** 16px – Liste öğe başlıkları */
    bodyMedium: 16,
    /** 17px – Alt başlık, form label, buton metni */
    subtitle: 17,
    /** 18px – Form input vurgu */
    subtitleLarge: 18,
    /** 19px – Ekran alt başlıkları */
    title: 19,
    /** 21px – Ekran başlıkları, header */
    titleLarge: 21,
    /** 23px – Modal başlık */
    titleXl: 23,
    /** 25px – Ana ekran başlıkları (Settings, Splash vb.) */
    display: 25,
} as const;

export type FontSizeKey = keyof typeof fontSize;
