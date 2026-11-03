import type {LabItem} from '../server/api/Lab';

/**
 * Öne çıkan / dikkat: referans dışı sayısal veya pozitif/reaktif nitel sonuç.
 * (Negatif tarama sonuçları buraya girmez — normal kabul.)
 */
export function isNotableLabItem(it: LabItem | null | undefined): boolean {
  if (!it) return false;
  const label = String(it.resultLabel || '').trim();
  if (/^(Pozitif|Positive|Reaktif|Reactive)$/i.test(label)) {
    return true;
  }
  const v = Number(it.value);
  const lo = Number(it.refLow);
  const hi = Number(it.refHigh);
  if (
    Number.isFinite(v) &&
    Number.isFinite(lo) &&
    Number.isFinite(hi) &&
    lo <= hi &&
    !(lo === 0 && hi === 0)
  ) {
    return v < lo || v > hi;
  }
  return false;
}

export function filterNotableLabItems(items: LabItem[] | null | undefined): LabItem[] {
  if (!Array.isArray(items)) return [];
  return items.filter(isNotableLabItem);
}
