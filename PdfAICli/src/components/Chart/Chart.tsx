// Halk için sade tahlil kartları: tek durum rozeti, net değer, sayısalda aralık çubuğu.
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

const YELLOW = '#CA8A04';
const GREEN = '#15803D';
const RED = '#B91C1C';
const TRACK = '#E5E7EB';
const ZONE = '#BBF7D0';

const BG_YELLOW = '#FFFBEB';
const BG_GREEN = '#F0FDF4';
const BG_RED = '#FEF2F2';
const BORDER_YELLOW = '#FDE68A';
const BORDER_GREEN = '#BBF7D0';
const BORDER_RED = '#FECACA';

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

type Tone = 'ok' | 'low' | 'high' | 'alert';

const Chart: React.FC<Props> = ({items = [], width = 320}) => {
  const t = useT();
  const {w1px, h1px} = useResponsive();
  const [barContainerWidth, setBarContainerWidth] = useState(0);
  const widthPx =
    barContainerWidth > 0
      ? Math.max(0, barContainerWidth)
      : width * w1px * 0.85;

  const s = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: 14 * w1px,
          paddingVertical: 10 * h1px,
          paddingHorizontal: 12 * w1px,
          marginBottom: 8 * h1px,
          borderWidth: 1,
          overflow: 'hidden',
          flexDirection: 'row',
          alignItems: 'stretch',
        },
        accent: {
          width: 4 * w1px,
          borderRadius: 999,
          marginRight: 10 * w1px,
          alignSelf: 'stretch',
        },
        body: {
          flex: 1,
          minWidth: 0,
        },
        topRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8 * w1px,
          marginBottom: 4 * h1px,
        },
        testName: {
          flex: 1,
          minWidth: 0,
        },
        statusPill: {
          paddingVertical: 4 * h1px,
          paddingHorizontal: 10 * w1px,
          borderRadius: 999,
          flexShrink: 0,
        },
        resultLabel: {
          marginBottom: 2 * h1px,
        },
        valueText: {
          marginBottom: 4 * h1px,
        },
        rangeRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 4 * w1px,
          marginBottom: 8 * h1px,
        },
        hint: {
          marginTop: 2 * h1px,
        },
        barWrapper: {
          width: '100%',
          marginTop: 2 * h1px,
          marginBottom: 2 * h1px,
        },
        bar: {
          height: 8 * h1px,
          borderRadius: 999,
          backgroundColor: TRACK,
          overflow: 'hidden',
          flexDirection: 'row',
        },
        seg: {height: '100%'},
        markerWrap: {
          position: 'absolute',
          top: -10 * h1px,
          width: 22 * w1px,
          alignItems: 'center',
          justifyContent: 'center',
        },
        markerCaption: {
          marginTop: 10 * h1px,
          alignSelf: 'flex-start',
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

  const groupsBySection = useMemo(() => {
    const map = new Map<string | null, typeof filtered>();
    const sectionOrder: (string | null)[] = [];
    for (const item of filtered) {
      const sec = (item as LabItem & {section?: string | null}).section ?? null;
      if (!map.has(sec)) {
        map.set(sec, []);
        sectionOrder.push(sec);
      }
      map.get(sec)!.push(item);
    }
    return sectionOrder
      .filter(section => (map.get(section)?.length ?? 0) > 0)
      .map(section => ({section, items: map.get(section)!}));
  }, [filtered]);

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

  const heartSize = iconSize.medium * Math.min(w1px, h1px);

  const renderCard = (item: LabItem) => {
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
    const pad = (scaleMax - scaleMin) * 0.08 || 0.5;
    scaleMin -= pad;
    scaleMax += pad;

    const toPct = (x: number) =>
      Math.max(0, Math.min(1, (x - scaleMin) / (scaleMax - scaleMin)));
    const toPx = (x: number) => widthPx * toPct(x);

    const leftW = _hasRef ? toPx(refLow) : 0;
    const midW = _hasRef ? Math.max(0, toPx(refHigh) - toPx(refLow)) : 0;
    const rightW = _hasRef ? Math.max(0, widthPx - leftW - midW) : widthPx;
    const markerLeft = toPx(v);

    const hasResultLabel =
      item.resultLabel && String(item.resultLabel).trim().length > 0;
    const negatifLike = /^(Negatif|Negative)$/i.test(
      String(item.resultLabel || ''),
    );
    const pozitifLike = /^(Pozitif|Positive|Reaktif|Reactive)$/i.test(
      String(item.resultLabel || ''),
    );
    const flag = !_hasRef
      ? 'N'
      : v < refLow
      ? 'L'
      : v > refHigh
      ? 'H'
      : 'N';

    const isCategorical = !_hasRef && !!hasResultLabel;

    let tone: Tone = 'ok';
    let flagText = t('history.statusNormal');
    let hint = t('history.hintNormal');

    if (isCategorical) {
      flagText = String(item.resultLabel).trim();
      if (negatifLike) {
        tone = 'ok';
        hint = t('history.hintNegative');
      } else if (pozitifLike) {
        tone = 'alert';
        hint = t('history.hintPositive');
      } else {
        tone = 'ok';
        hint = '';
      }
    } else if (flag === 'L') {
      tone = 'low';
      flagText = t('history.statusLow');
      hint = t('history.hintLow');
    } else if (flag === 'H') {
      tone = 'high';
      flagText = t('history.statusHigh');
      hint = t('history.hintHigh');
    }

    const toneColor =
      tone === 'ok' ? GREEN : tone === 'low' ? YELLOW : RED;
    const toneBg =
      tone === 'ok' ? BG_GREEN : tone === 'low' ? BG_YELLOW : BG_RED;
    const toneBorder =
      tone === 'ok'
        ? BORDER_GREEN
        : tone === 'low'
        ? BORDER_YELLOW
        : BORDER_RED;

    const rawUnit = item.unit != null ? String(item.unit).trim() : '';
    const unitStr =
      rawUnit && rawUnit !== 'null' && rawUnit.toLowerCase() !== 'undefined'
        ? ` ${rawUnit}`
        : '';

    const valueDisplay =
      item.valueDisplay != null && String(item.valueDisplay).trim() !== ''
        ? `${String(item.valueDisplay).trim()}${unitStr}`
        : `${fmtNum(v)}${unitStr}`;

    return (
      <View
        style={[
          s.card,
          {backgroundColor: toneBg, borderColor: toneBorder},
        ]}>
        <View style={[s.accent, {backgroundColor: toneColor}]} />
        <View style={s.body}>
          <View style={s.topRow}>
            <T
              size={fontSize.bodyMedium}
              weight="700"
              color="#111827"
              numberOfLines={2}
              style={s.testName}>
              {displayTestName(item.test, item.label)}
            </T>
            <View style={[s.statusPill, {backgroundColor: '#fff'}]}>
              <T size={fontSize.label} weight="700" color={toneColor}>
                {flagText}
              </T>
            </View>
          </View>

          {!isCategorical && (
            <>
              <T
                size={fontSize.bodySmall}
                color="#6B7280"
                style={s.resultLabel}>
                {t('history.yourResult')}
              </T>
              <T
                size={fontSize.subtitle}
                weight="700"
                color="#111827"
                style={s.valueText}>
                {valueDisplay}
              </T>
            </>
          )}

          {_hasRef && (
            <View style={s.rangeRow}>
              <T size={fontSize.bodySmall} color="#6B7280">
                {t('history.normalRange')}:
              </T>
              <T size={fontSize.bodySmall} weight="600" color="#374151">
                {`${fmtNum(refLow)} – ${fmtNum(refHigh)}${unitStr}`}
              </T>
            </View>
          )}

          {_hasRef && !isCategorical && (
            <View
              style={s.barWrapper}
              onLayout={e =>
                setBarContainerWidth(e.nativeEvent.layout.width)
              }>
              <View style={[s.bar, {width: widthPx}]}>
                <View style={[s.seg, {width: leftW, backgroundColor: TRACK}]} />
                <View style={[s.seg, {width: midW, backgroundColor: ZONE}]} />
                <View
                  style={[s.seg, {width: rightW, backgroundColor: TRACK}]}
                />
              </View>
              <View
                style={[
                  s.markerWrap,
                  {
                    left: Math.max(
                      0,
                      Math.min(widthPx - heartSize, markerLeft - heartSize / 2),
                    ),
                  },
                ]}>
                <Ionicons
                  name="heart"
                  size={heartSize}
                  color={colors.backgroundPurple}
                />
              </View>
              <T
                size={fontSize.bodySmall}
                color="#6B7280"
                style={s.markerCaption}>
                {t('history.youMarker')}
              </T>
            </View>
          )}

          {!!hint && (
            <T size={fontSize.bodySmall} color="#4B5563" style={s.hint}>
              {hint}
            </T>
          )}
        </View>
      </View>
    );
  };

  if (!filtered.length) {
    return <EmptyState title={t('history.noData')} style={{height: '70%'}} />;
  }

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
            {renderCard(item)}
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
