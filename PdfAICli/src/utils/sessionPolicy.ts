/**
 * Arka plan / idle oturum kararları (saf fonksiyon — birim test için).
 */

export type SessionKeepFlags = {
    loading: boolean;
    holdCount: number;
};

export type BackgroundLogoutDecision =
    | { action: 'skip' }
    | { action: 'schedule'; delayMs: number }
    | { action: 'logout_now' };

export function shouldKeepSessionAlive(flags: SessionKeepFlags): boolean {
    return flags.loading || flags.holdCount > 0;
}

/**
 * App background olduğunda ne yapılmalı?
 * - dev: hiçbir şey
 * - hold/loading: timer başlatma (kısa süreli picker/reklam)
 * - aksi halde grace sonra logout
 */
export function decideOnBackground(opts: {
    isDev: boolean;
    flags: SessionKeepFlags;
    graceMs: number;
}): BackgroundLogoutDecision {
    if (opts.isDev) {
        return { action: 'skip' };
    }
    if (shouldKeepSessionAlive(opts.flags)) {
        return { action: 'skip' };
    }
    if (opts.graceMs <= 0) {
        return { action: 'logout_now' };
    }
    return { action: 'schedule', delayMs: opts.graceMs };
}

/**
 * Grace timer ateşlendiğinde logout yapılmalı mı?
 */
export function shouldLogoutAfterBackgroundGrace(opts: {
    appStillBackground: boolean;
    flags: SessionKeepFlags;
}): boolean {
    if (!opts.appStillBackground) {
        return false;
    }
    if (shouldKeepSessionAlive(opts.flags)) {
        return false;
    }
    return true;
}

/** Ön plan idle süresi doldu mu? */
export function shouldLogoutForIdle(opts: {
    now: number;
    lastActivityAt: number;
    timeoutMs: number;
}): boolean {
    return opts.now - opts.lastActivityAt >= opts.timeoutMs;
}
