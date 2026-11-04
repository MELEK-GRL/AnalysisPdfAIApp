import type {
  LabCompareCommonItem,
  LabCompareSideValue,
  LabItem,
} from '../server/api/Lab';

/**
 * Öne çıkan / dikkat: referans dışı sayısal veya pozitif/reaktif nitel sonuç.
 * (Negatif tarama sonuçları buraya girmez — normal kabul.)
 */
function isPositiveLabel(label: string | null | undefined): boolean {
  return /^(Pozitif|Positive|Reaktif|Reactive)$/i.test(String(label || '').trim());
}

function isOutOfRange(
  value: number | null | undefined,
  refLow: number | null | undefined,
  refHigh: number | null | undefined,
  flag?: 'L' | 'N' | 'H' | null,
): boolean {
  if (flag === 'L' || flag === 'H') return true;
  const v = Number(value);
  const lo = Number(refLow);
  const hi = Number(refHigh);
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

export function isNotableLabItem(it: LabItem | null | undefined): boolean {
  if (!it) return false;
  if (isPositiveLabel(it.resultLabel)) return true;
  return isOutOfRange(it.value, it.refLow, it.refHigh);
}

export function filterNotableLabItems(items: LabItem[] | null | undefined): LabItem[] {
  if (!Array.isArray(items)) return [];
  return items.filter(isNotableLabItem);
}

function isNotableCompareSide(side: LabCompareSideValue | null | undefined): boolean {
  if (!side) return false;
  if (isPositiveLabel(side.resultLabel)) return true;
  return isOutOfRange(side.value, side.refLow, side.refHigh, side.flag);
}

/** Karşılaştırmada: en az bir tarafta dikkat gerektiren ortak parametre */
export function isNotableCompareItem(
  item: LabCompareCommonItem | null | undefined,
): boolean {
  if (!item) return false;
  return isNotableCompareSide(item.lab1) || isNotableCompareSide(item.lab2);
}

export function filterNotableCompareItems(
  items: LabCompareCommonItem[] | null | undefined,
): LabCompareCommonItem[] {
  if (!Array.isArray(items)) return [];
  return items.filter(isNotableCompareItem);
}
