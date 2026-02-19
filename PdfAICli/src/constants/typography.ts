/**
 * App genelinde tek yerden kontrol edilen tipografi standartları.
 * Tüm text boyutları bu constants'tan beslenir.
 */
export const fontSize = {
    /** 13px – Küçük etiketler, secondary bilgi */
    caption: 13,
    /** 14px – Tarih, meta bilgiler */
    captionLarge: 14,
    /** 15px – Tab label, küçük buton metni */
    label: 15,
    /** 16px – İkincil body metin */
    bodySmall: 16,
    /** 17px – Ana body metin (varsayılan) */
    body: 17,
    /** 18px – Liste öğe başlıkları */
    bodyMedium: 18,
    /** 19px – Alt başlık, form label, buton metni */
    subtitle: 19,
    /** 20px – Form input vurgu */
    subtitleLarge: 20,
    /** 21px – Ekran alt başlıkları */
    title: 21,
    /** 23px – Ekran başlıkları, header */
    titleLarge: 23,
    /** 25px – Modal başlık */
    titleXl: 25,
    /** 27px – Ana ekran başlıkları (Settings, Splash vb.) */
    display: 27,
} as const;

export type FontSizeKey = keyof typeof fontSize;
