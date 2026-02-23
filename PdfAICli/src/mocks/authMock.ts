/**
 * Auth API mock yanıtları – test ve geliştirme için.
 * Jest mock'larında veya MSW ile kullanılabilir.
 *
 * ✅ TAMAMLANDI: Şifremi unuttum (e-posta ile kod)
 * - Kullanıcı sadece e-posta girer → kod maile gider (SMTP) veya dev'de devCode döner
 * - 24 saatte 4 kod hakkı, kod 3 dakika geçerli
 * - Kayıtsız e-posta → popup "Bu e-posta kayıtlı değil"
 * - ResetPassword ekranında kullanıcı kodu girer, yeni şifre belirler
 */

export type User = { _id: string; name: string; email: string };
export type AuthResponse = { token: string; user: User };

export const mockAuth = {
    /** Şifremi unuttum – başarılı (sadece e-posta; kod maile gider) */
    forgotPasswordSuccess: (email: string) =>
        ({ ok: true as const, email }),

    /** Şifremi unuttum – e-posta kayıtlı değil (404) */
    forgotPasswordEmailNotFound: () =>
        ({ ok: false, message: 'Email not registered' }),

    /** Şifremi unuttum – 24 saatte 4 hak aşıldı (429) */
    forgotPasswordLimitReached: () =>
        ({ ok: false, message: 'FORGOT_PASSWORD_LIMIT_REACHED', code: 'FORGOT_PASSWORD_LIMIT_REACHED' }),

    /** Şifremi unuttum – e-posta servisi kullanılamıyor (503) */
    forgotPasswordEmailServiceUnavailable: () =>
        ({ ok: false, message: 'EMAIL_SERVICE_UNAVAILABLE', code: 'EMAIL_SERVICE_UNAVAILABLE' }),

    /** 6 haneli kod ile şifre sıfırlama – başarılı */
    resetPasswordByCodeSuccess: () =>
        ({ message: 'Password updated. You can sign in with your new password.' }),

    /** 6 haneli kod ile şifre sıfırlama – geçersiz/süresi dolmuş kod */
    resetPasswordByCodeInvalidCode: () =>
        ({ message: 'Invalid or expired code' }),

    /** Token ile şifre sıfırlama – başarılı */
    resetPasswordByTokenSuccess: () =>
        ({ message: 'Password updated. You can sign in with your new password.' }),

    /** Giriş – başarılı (test kullanıcısı) */
    loginSuccess: (overrides?: Partial<AuthResponse>): AuthResponse => ({
        token: 'mock-jwt-token',
        user: { _id: 'mock-user-id', name: 'Test User', email: 'test@example.com' },
        ...overrides,
    }),

    /** Kayıt – başarılı */
    registerSuccess: (overrides?: Partial<AuthResponse>): AuthResponse => ({
        token: 'mock-jwt-token',
        user: { _id: 'mock-user-id', name: 'New User', email: 'new@example.com' },
        ...overrides,
    }),
};
