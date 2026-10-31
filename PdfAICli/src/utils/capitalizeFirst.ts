/** Metnin ilk harfini büyük yapar (kayıt adı / login identifier). */
export function capitalizeFirst(value: string): string {
    const s = value.trim();
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Yazarken ilk harfi büyük tutar (trim etmez, ortadaki boşluklar korunur). */
export function capitalizeFirstTyping(value: string): string {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1);
}
