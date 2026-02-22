// src/components/Chart.tsx
// Yaşlı dostu, şık tahlil sonucu gösterimi. Kartlar 10'ar sayfalanır (sayfa kasmasın).
import React, {useMemo, useState, useEffect} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type {LabItem} from '../../server/api/Lab';
import {useResponsive} from '../../utils/deviceStore/device';
import {useT} from '../../store/useLocaleStore';
import T from '../../components/Text/T';
import EmptyState from '../../components/EmptyState/EmptyState';
import {fontSize} from '../../constants/typography';
import {iconSize} from '../../constants/icons';
import colors from '../../theme/colors';

const PAGE_SIZE = 10;

type Props = {items: LabItem[]; width?: number};

const YELLOW = '#EAB308'; // düşük – sarı
const GREEN = '#22C55E'; // normal – yeşil
const RED = '#DC2626'; // yüksek – kırmızı
const BAR_DEFAULT = '#E5E7EB'; // referans aralığı yok → bar varsayılan (gri)
const HEART_PURPLE = '#9333EA'; // kalp ikonu her zaman mor

const BG_YELLOW = '#FEFCE8';
const BG_GREEN = '#F0FDF4';
const BG_RED = '#FEF2F2';

const fmtNum = (n: number) =>
  Number.isFinite(n)
    ? Math.abs(n) >= 100
      ? n.toFixed(0)
      : Math.abs(n) >= 10
      ? n.toFixed(1)
      : n.toFixed(2)
    : String(n);

const BLACKLIST = [
  /^\s*[:\-–]?\s*$/i,
  /^değer/i,
  /^sonuç$/i,
  /^analiz/i,
  /^ref/i,
  /^birim/i,
  /^HPF$/i,
  /^(Sayfa|Page)\s*\d*$/i,
  /\.(gov|tr|com|net|org)(\s|$)/i,
  /^https?:\/\//i,
  /^www\./i,
];

const hasRef = (it: LabItem) => {
  const lo = Number(it?.refLow);
  const hi = Number(it?.refHigh);
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo > hi) {
    return false;
  }
  if (lo === 0 && hi === 0) {
    return false;
  }
  return true;
};

/** Kartta gösterilecek test adı: (ACIL) kaldır; uzun büyük isimleri Potasyum/Amilaz yap, HGB/WBC kısaltmaları aynen. */
const displayTestName = (
  test: string | null | undefined,
  label: string | null | undefined,
): string => {
  const raw = (test || label || '').trim();
  if (!raw) {
    return '';
  }
  const s =
    raw
      .replace(/\s*\((ACİL|ACIL)\)\s*$/gi, '')
      .replace(/\s*\(CL\)\s*$/gi, '')
      .replace(/\s*\(NA\)\s*$/gi, '')
      .trim() || raw;
  if (s.length <= 1) {
    return s;
  }
  if (s.length <= 4 && s === s.toUpperCase()) {
    return s;
  }
  if (s === s.toUpperCase() && /^[A-Za-zİıĞğÜüŞşÖöÇç\s]+$/.test(s)) {
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }
  return s;
};

const BAR_HORIZONTAL_PADDING = 0;

const Chart: React.FC<Props> = ({items = [], width = 320}) => {
  const t = useT();
  const {w1px, h1px} = useResponsive();
  const [barContainerWidth, setBarContainerWidth] = useState(0);
  const widthPx =
    barContainerWidth > 0
      ? Math.max(0, barContainerWidth - BAR_HORIZONTAL_PADDING * 2)
      : width * w1px * 0.85; // fallback until onLayout

  const s = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: '#fff',
          borderRadius: 16 * w1px,
          padding: 12 * w1px,
          marginBottom: 14 * h1px,
          borderWidth: 1,
          borderColor: '#F3F4F6',
          shadowColor: '#000',
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        },
        testName: {
          marginBottom: 8 * h1px,
          paddingRight: 6 * w1px,
        },
        valueRow: {
          flexDirection: 'row',
          alignItems: 'baseline',
          marginBottom: 6 * h1px,
          gap: 8 * w1px,
        },
        rangeRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 6 * h1px,
          flexWrap: 'wrap',
        },
        barWrapper: {
          width: '100%',
          alignItems: 'center',
          marginTop: 6 * h1px,
          marginBottom: 8 * h1px,
          paddingHorizontal: BAR_HORIZONTAL_PADDING * w1px,
          position: 'relative',
        },
        bar: {
          height: 12 * h1px,
          borderRadius: 6 * w1px,
          backgroundColor: '#F3F4F6',
          position: 'relative',
          overflow: 'hidden',
          flexDirection: 'row',
        },
        seg: {height: '100%'},
        markerWrap: {
          position: 'absolute',
          top: -10 * h1px,
          alignItems: 'center',
          justifyContent: 'center',
        },
        statusPillWrapper: {
          width: '100%',
          alignItems: 'center',
        },
        statusPill: {
          paddingVertical: 5 * h1px,
          paddingHorizontal: 10 * w1px,
          borderRadius: 999,
        },
      }),
    [w1px, h1px],
  );

  const filtered = useMemo(() => {
    const arr = Array.isArray(items) ? items : [];
    return arr.filter(it => {
      const name = String(it.label || it.test || '').trim();
      if (!name || name.length < 2) {
        return false;
      }
      return !BLACKLIST.some(rx => rx.test(name));
    });
  }, [items]);

  // Bölüm sırası PDF/API’den gelen sıraya göre (ilk geçiş sırası); sabit başlık listesi yok.
  const groupsBySection = useMemo(() => {
    const map = new Map<string | null, typeof filtered>();
    const sectionOrder: (string | null)[] = [];
    for (const item of filtered) {
      const s = (item as LabItem & {section?: string | null}).section ?? null;
      if (!map.has(s)) {
        map.set(s, []);
        sectionOrder.push(s);
      }
      map.get(s)!.push(item);
    }
    return sectionOrder
      .filter(section => (map.get(section)?.length ?? 0) > 0)
      .map(section => ({section, items: map.get(section)!}));
  }, [filtered]);

  // Sayfalama: tüm kartları düz listeye al, 10'ar göster.
  const flatCards = useMemo(() => {
    const out: {section: string | null; item: LabItem}[] = [];
    for (const {section, items: groupItems} of groupsBySection) {
      for (const item of groupItems) {
        out.push({section, item});
      }
    }
    return out;
  }, [groupsBySection]);
  const totalCards = flatCards.length;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleCards = useMemo(
    () => flatCards.slice(0, Math.min(visibleCount, totalCards)),
    [flatCards, visibleCount, totalCards],
  );
  const hasMore = visibleCount < totalCards;
  const showMore = () =>
    setVisibleCount(c => Math.min(c + PAGE_SIZE, totalCards));
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [totalCards]);

  if (!filtered.length) {
    return <EmptyState title={t('history.noData')} style={{height: '70%'}} />;
  }

  const RangeRow: React.FC<{item: LabItem}> = ({item}) => {
    const v = Number(item.value);
    const _hasRef = hasRef(item);
    const rawLow = _hasRef ? Number(item.refLow) : v;
    const rawHigh = _hasRef ? Number(item.refHigh) : v;
    const refLow = Math.min(rawLow, rawHigh);
    const refHigh = Math.max(rawLow, rawHigh);

    let scaleMin = _hasRef ? Math.min(refLow, v) : v - 1;
    let scaleMax = _hasRef ? Math.max(refHigh, v) : v + 1;
    if (scaleMin === scaleMax) {
      scaleMin -= 1;
      scaleMax += 1;
    }

    const toPct = (x: number) =>
      Math.max(0, Math.min(1, (x - scaleMin) / (scaleMax - scaleMin)));
    const toPx = (x: number) => widthPx * toPct(x);

    const leftW = _hasRef ? toPx(refLow) : widthPx;
        const midW = _hasRef ? Math.max(0, toPx(refHigh) - toPx(refLow)) : 0;
        const markerLeft = toPx(v);

    // Aralık altı = sarı (L), aralık üstü = kırmızı (H), aralıkta = yeşil (N)
    const flag = v < refLow ? 'L' : v > refHigh ? 'H' : 'N';
    const hasResultLabel =
      item.resultLabel && String(item.resultLabel).trim().length > 0;
    const negatifLike = /^(Negatif|Negative)$/i.test(
      String(item.resultLabel || ''),
    );
    const pozitifLike = /^(Pozitif|Positive|Reaktif)$/i.test(
      String(item.resultLabel || ''),
    );
    const flagText = hasResultLabel
      ? String(item.resultLabel).trim()
      : flag === 'L'
      ? t('history.statusLow')
      : flag === 'H'
      ? t('history.statusHigh')
      : t('history.statusNormal');
    const flagColor = hasResultLabel
      ? negatifLike
        ? GREEN
        : pozitifLike
        ? RED
        : flag === 'H'
        ? RED
        : flag === 'L'
        ? YELLOW
        : GREEN
      : flag === 'H'
      ? RED
      : flag === 'L'
      ? YELLOW
      : GREEN;
    const bgColor = hasResultLabel
      ? negatifLike
        ? BG_GREEN
        : pozitifLike
        ? BG_RED
        : flag === 'H'
        ? BG_RED
        : flag === 'L'
        ? BG_YELLOW
        : BG_GREEN
      : flag === 'H'
      ? BG_RED
      : flag === 'L'
      ? BG_YELLOW
      : BG_GREEN;

    const rawUnit = item.unit != null ? String(item.unit).trim() : '';
    const unitStr =
      rawUnit && rawUnit !== 'null' && rawUnit.toLowerCase() !== 'undefined'
        ? ` ${rawUnit}`
        : '';
    // Kategorik sonuç (referans yok + Negatif/Pozitif vb.): sayı yerine sonuç etiketini göster (örn. HPV "Negatif")
    const isCategorical = !_hasRef && hasResultLabel;

    return (
      <View style={s.card}>
        {/* Test adı – Potasyum, Klor, Amilaz gibi okunaklı isim */}
        <T
          size={fontSize.subtitle}
          weight="600"
          color="#111827"
          numberOfLines={2}
          style={s.testName}>
          {displayTestName(item.test, item.label)}
        </T>

        {/* Kullanıcının değeri – kategorikse (HPV Negatif vb.) etiket; değilse sayı veya valueDisplay */}
        <View style={s.valueRow}>
          <T size={fontSize.title} weight="700" color={flagColor}>
            {isCategorical
              ? flagText
              : item.valueDisplay != null &&
                String(item.valueDisplay).trim() !== ''
              ? `${String(item.valueDisplay).trim()}${unitStr}`
              : `${fmtNum(v)}${unitStr}`}
          </T>
          <T size={fontSize.body} color="#6B7280">
            ({t('history.yourResult')})
          </T>
        </View>

        {/* Normal aralık – sadece belirtilmişse göster */}
        {_hasRef && (
          <View style={s.rangeRow}>
            <T size={fontSize.body} color="#6B7280">
              {t('history.normalRange')}:
            </T>
            <T
              size={fontSize.body}
              weight="600"
              color="#374151"
              style={{marginLeft: 4}}>
              {`${fmtNum(refLow)} – ${fmtNum(refHigh)}${unitStr}`}
            </T>
          </View>
        )}

        {/* Görsel ölçek çubuğu */}
        <View
          style={s.barWrapper}
          onLayout={e => setBarContainerWidth(e.nativeEvent.layout.width)}>
          <View style={[s.bar, {width: widthPx}]}>
            {_hasRef ? (
              <View
                style={[s.seg, {width: widthPx, backgroundColor: flagColor}]}
              />
            ) : (
              <View
                style={[
                  s.seg,
                  {
                    width: widthPx,
                    backgroundColor: hasResultLabel ? flagColor : BAR_DEFAULT,
                  },
                ]}
              />
            )}
          </View>
          {!isCategorical && (
            <View
              style={[
                s.markerWrap,
                {
                  left:
                    (barContainerWidth - widthPx) / 2 +
                    Math.max(
                      0,
                      Math.min(
                        widthPx - iconSize.large * w1px,
                        markerLeft -
                          (iconSize.large / 2) * Math.min(w1px, h1px),
                      ),
                    ),
                },
              ]}>
              <Ionicons
                name="heart"
                size={iconSize.large * Math.min(w1px, h1px)}
                color={HEART_PURPLE}
              />
            </View>
          )}
        </View>

        {/* Değer + Normal/Negatif/Pozitif notumuz (Durum: Normal / Negatif / Pozitif / Düşük / Yüksek) */}
        <View
          style={[
            s.statusPillWrapper,
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            },
          ]}>
          <T size={fontSize.body} color="#6B7280">
            {t('history.statusLabel')}:
          </T>
          <View style={[s.statusPill, {backgroundColor: bgColor}]}>
            <T size={fontSize.body} weight="700" color={flagColor}>
              {flagText}
            </T>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{paddingVertical: 4 * h1px}}>
      {visibleCards.map(({section, item}, idx) => {
        const prevSection = idx > 0 ? visibleCards[idx - 1].section : null;
        const showSectionHeader = section !== prevSection;
        return (
          <View key={`${section ?? 'n'}-${item.test}-${idx}`}>
            {showSectionHeader && section != null && section !== '' && (
              <View
                style={{
                  marginBottom: 8 * h1px,
                  marginTop: idx > 0 ? 14 * h1px : 0,
                }}>
                <T size={fontSize.label} weight="700" color="#6B7280">
                  {section}
                </T>
              </View>
            )}
            {showSectionHeader &&
              (section == null || section === '') &&
              idx > 0 && <View style={{marginTop: 14 * h1px}} />}
            <RangeRow item={item} />
          </View>
        );
      })}
      {hasMore && (
        <TouchableOpacity
          onPress={showMore}
          activeOpacity={0.7}
          style={{
            marginTop: 12 * h1px,
            paddingVertical: 10 * h1px,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6 * w1px,
          }}>
          <Ionicons
            name="chevron-down"
            size={iconSize.medium}
            color={colors.backgroundPurple}
          />
          <T size={fontSize.body} weight="600" color={colors.backgroundPurple}>
            {t('history.showMore')}
          </T>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default Chart;
