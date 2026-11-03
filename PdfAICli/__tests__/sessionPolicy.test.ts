import {
    decideOnBackground,
    shouldKeepSessionAlive,
    shouldLogoutAfterBackgroundGrace,
    shouldLogoutForIdle,
} from '../src/utils/sessionPolicy';

describe('sessionPolicy', () => {
    describe('shouldKeepSessionAlive', () => {
        it('loading iken tutar', () => {
            expect(
                shouldKeepSessionAlive({ loading: true, holdCount: 0 }),
            ).toBe(true);
        });
        it('holdCount > 0 iken tutar', () => {
            expect(
                shouldKeepSessionAlive({ loading: false, holdCount: 1 }),
            ).toBe(true);
        });
        it('ikisi de kapalıysa tutmaz', () => {
            expect(
                shouldKeepSessionAlive({ loading: false, holdCount: 0 }),
            ).toBe(false);
        });
    });

    describe('decideOnBackground', () => {
        const graceMs = 10 * 60 * 1000;

        it('dev ortamında skip (emulator IDE geçişi)', () => {
            expect(
                decideOnBackground({
                    isDev: true,
                    flags: { loading: false, holdCount: 0 },
                    graceMs,
                }),
            ).toEqual({ action: 'skip' });
        });

        it('PDF seçici hold varken skip — anında logout yok', () => {
            expect(
                decideOnBackground({
                    isDev: false,
                    flags: { loading: false, holdCount: 1 },
                    graceMs,
                }),
            ).toEqual({ action: 'skip' });
        });

        it('analiz loading varken skip', () => {
            expect(
                decideOnBackground({
                    isDev: false,
                    flags: { loading: true, holdCount: 0 },
                    graceMs,
                }),
            ).toEqual({ action: 'skip' });
        });

        it('reklam/picker yokken grace schedule eder (anında logout YOK)', () => {
            expect(
                decideOnBackground({
                    isDev: false,
                    flags: { loading: false, holdCount: 0 },
                    graceMs,
                }),
            ).toEqual({ action: 'schedule', delayMs: graceMs });
        });

        it('grace 0 ise hemen logout (eski davranış)', () => {
            expect(
                decideOnBackground({
                    isDev: false,
                    flags: { loading: false, holdCount: 0 },
                    graceMs: 0,
                }),
            ).toEqual({ action: 'logout_now' });
        });
    });

    describe('shouldLogoutAfterBackgroundGrace', () => {
        it('ön plana dönüldüyse logout yok', () => {
            expect(
                shouldLogoutAfterBackgroundGrace({
                    appStillBackground: false,
                    flags: { loading: false, holdCount: 0 },
                }),
            ).toBe(false);
        });

        it('hâlâ background + hold yok → logout', () => {
            expect(
                shouldLogoutAfterBackgroundGrace({
                    appStillBackground: true,
                    flags: { loading: false, holdCount: 0 },
                }),
            ).toBe(true);
        });

        it('grace sırasında picker/reklam hold açıldıysa logout yok', () => {
            expect(
                shouldLogoutAfterBackgroundGrace({
                    appStillBackground: true,
                    flags: { loading: false, holdCount: 2 },
                }),
            ).toBe(false);
        });

        it('upload loading sırasında logout yok', () => {
            expect(
                shouldLogoutAfterBackgroundGrace({
                    appStillBackground: true,
                    flags: { loading: true, holdCount: 0 },
                }),
            ).toBe(false);
        });
    });

    describe('shouldLogoutForIdle', () => {
        const timeoutMs = 20 * 60 * 1000;

        it('20 dk dolmadan idle logout yok', () => {
            expect(
                shouldLogoutForIdle({
                    now: 1000 + timeoutMs - 1,
                    lastActivityAt: 1000,
                    timeoutMs,
                }),
            ).toBe(false);
        });

        it('20 dk dolunca idle logout', () => {
            expect(
                shouldLogoutForIdle({
                    now: 1000 + timeoutMs,
                    lastActivityAt: 1000,
                    timeoutMs,
                }),
            ).toBe(true);
        });
    });

    describe('senaryolar: reklam sonrası PDF seçimi', () => {
        const graceMs = 10 * 60 * 1000;

        it('reklam background → hold ile skip', () => {
            const d = decideOnBackground({
                isDev: false,
                flags: { loading: false, holdCount: 1 },
                graceMs,
            });
            expect(d.action).toBe('skip');
        });

        it('reklam bitti, kısa PDF picker background → grace schedule; birkaç sn sonra dönüşte logout yok', () => {
            const d = decideOnBackground({
                isDev: false,
                flags: { loading: false, holdCount: 0 },
                graceMs,
            });
            expect(d).toEqual({ action: 'schedule', delayMs: graceMs });

            // Kullanıcı 30 sn sonra döndü — grace ateşlenmeden active
            expect(
                shouldLogoutAfterBackgroundGrace({
                    appStillBackground: false,
                    flags: { loading: false, holdCount: 0 },
                }),
            ).toBe(false);
        });

        it('eski davranış (grace=0) picker ile kırılırdı', () => {
            expect(
                decideOnBackground({
                    isDev: false,
                    flags: { loading: false, holdCount: 0 },
                    graceMs: 0,
                }).action,
            ).toBe('logout_now');
        });
    });
});
