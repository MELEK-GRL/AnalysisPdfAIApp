/** Kullanıcıya gösterilen hata/bilgi mesajları (fallback, asıl metinler locales’ten) */

export const MESSAGES = {
    uploadError: 'PDF yüklenemedi.',
    rateLimitReached: 'Günlük analiz hakkınız doldu. 24 saat içinde en fazla 2 kez PDF analizi yapabilirsiniz.',
    selectPdfFirst: 'Lütfen önce tahlil sonucu PDF’ini yükleyin.',
} as const;
