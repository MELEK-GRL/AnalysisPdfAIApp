/**
 * Popup Modal fade kapanırken overlay loading açılsın diye kısa bekle.
 * (Özellikle Android Modal üst üste binmesin diye.)
 */
export function waitForPopupClose(ms = 400): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}
