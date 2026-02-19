// src/components/Chart.tsx
// Yaşlı dostu, şık tahlil sonucu gösterimi
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import type { LabItem } from '../../server/api/Lab';
import { useResponsive } from '../../utils/deviceStore/device';
import { useLocaleStore } from '../../store/useLocaleStore';
import T from '../../components/Text/T';
import { fontSize } from '../../constants/typography';

type Props = { items: LabItem[]; width?: number };

const YELLOW = '#EAB308'; // düşük – sarı
const GREEN = '#22C55E'; // normal – yeşil
const RED = '#DC2626'; // yüksek – kırmızı
const GRAY = '#E5E7EB';

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
];

const hasRef = (it: LabItem) => {
    const lo = Number(it?.refLow);
    const hi = Number(it?.refHigh);
    return Number.isFinite(lo) && Number.isFinite(hi) && lo < hi;
};

const BAR_HORIZONTAL_PADDING = 0;

const Chart: React.FC<Props> = ({ items = [], width = 320 }) => {
    const t = useLocaleStore((s) => s.t);
    const { w1px, h1px } = useResponsive();
    const [barContainerWidth, setBarContainerWidth] = useState(0);
    const widthPx = barContainerWidth > 0
        ? Math.max(0, barContainerWidth - BAR_HORIZONTAL_PADDING * 2)
        : width * w1px * 0.85; // fallback until onLayout

    const s = useMemo(
        () =>
            StyleSheet.create({
                card: {
                    backgroundColor: '#fff',
                    borderRadius: 16 * w1px,
                    padding: 16 * w1px,
                    marginBottom: 14 * h1px,
                    borderWidth: 1,
                    borderColor: '#F3F4F6',
                    shadowColor: '#000',
                    shadowOpacity: 0.04,
                    shadowRadius: 8,
                    elevation: 2,
                },
                testName: {
                    marginBottom: 12 * h1px,
                    paddingRight: 8 * w1px,
                },
                valueRow: {
                    flexDirection: 'row',
                    alignItems: 'baseline',
                    marginBottom: 8 * h1px,
                    gap: 8 * w1px,
                },
                rangeRow: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 10 * h1px,
                    flexWrap: 'wrap',
                },
                barWrapper: {
                    width: '100%',
                    alignItems: 'center',
                    marginTop: 8 * h1px,
                    marginBottom: 10 * h1px,
                    paddingHorizontal: BAR_HORIZONTAL_PADDING * w1px,
                },
                bar: {
                    height: 12 * h1px,
                    borderRadius: 6 * w1px,
                    backgroundColor: '#F3F4F6',
                    position: 'relative',
                    overflow: 'hidden',
                    flexDirection: 'row',
                },
                seg: { height: '100%' },
                marker: {
                    position: 'absolute',
                    top: -2 * h1px,
                    width: 4 * w1px,
                    height: 16 * h1px,
                    borderRadius: 2,
                },
                statusPillWrapper: {
                    width: '100%',
                    alignItems: 'center',
                },
                statusPill: {
                    paddingVertical: 6 * h1px,
                    paddingHorizontal: 12 * w1px,
                    borderRadius: 999,
                },
                placeholder: {
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '70%',
                },
                imageView: {
                    alignSelf: 'center',
                    width: 80 * w1px,
                    height: 80 * h1px,
                    resizeMode: 'contain',
                },
            }),
        [w1px, h1px],
    );

    const filtered = useMemo(() => {
        const arr = Array.isArray(items) ? items : [];
        return arr.filter(it => {
            const name = String(it.label || it.test || '').trim();
            if (!name || name.length < 2) return false;
            return !BLACKLIST.some(rx => rx.test(name));
        });
    }, [items]);

    if (!filtered.length) {
        return (
            <View style={s.placeholder}>
                <Image
                    source={require('../../assets/icons/noData.png')}
                    style={s.imageView}
                />
                <T size={fontSize.subtitle} weight="700" color="#6B7280">
                    {t('history.noData')}
                </T>
            </View>
        );
    }

    const RangeRow: React.FC<{ item: LabItem }> = ({ item }) => {
        const v = Number(item.value);
        const _hasRef = hasRef(item);
        const refLow = _hasRef ? Number(item.refLow) : v;
        const refHigh = _hasRef ? Number(item.refHigh) : v;

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
        const rightW = _hasRef ? Math.max(0, widthPx - (leftW + midW)) : 0;
        const markerLeft = toPx(v);

        const flag = v < refLow ? 'L' : v > refHigh ? 'H' : 'N';
        const flagText = flag === 'L' ? t('history.statusLow') : flag === 'H' ? t('history.statusHigh') : t('history.statusNormal');
        const flagColor = flag === 'H' ? RED : flag === 'L' ? YELLOW : GREEN;
        const bgColor = flag === 'H' ? BG_RED : flag === 'L' ? BG_YELLOW : BG_GREEN;

        const unitStr = item.unit ? ` ${item.unit}` : '';

        return (
            <View style={s.card}>
                {/* Test adı */}
                <T
                    size={fontSize.subtitle}
                    weight="600"
                    color="#111827"
                    numberOfLines={2}
                    style={s.testName}>
                    {item.label || item.test}
                </T>

                {/* Kullanıcının değeri – büyük, renkli */}
                <View style={s.valueRow}>
                    <T size={fontSize.title} weight="700" color={flagColor}>
                        {fmtNum(v)}
                        {unitStr}
                    </T>
                    <T size={fontSize.body} color="#6B7280">
                        ({t('history.yourResult')})
                    </T>
                </View>

                {/* Normal aralık */}
                <View style={s.rangeRow}>
                    <T size={fontSize.body} color="#6B7280">
                        {t('history.normalRange')}:
                    </T>
                    <T
                        size={fontSize.body}
                        weight="600"
                        color="#374151"
                        style={{ marginLeft: 4 }}>
                        {_hasRef
                            ? `${fmtNum(refLow)} – ${fmtNum(refHigh)}${unitStr}`
                            : t('history.notSpecified')}
                    </T>
                </View>

                {/* Görsel ölçek çubuğu */}
                <View
                    style={s.barWrapper}
                    onLayout={(e) => setBarContainerWidth(e.nativeEvent.layout.width)}>
                <View style={[s.bar, { width: widthPx }]}>
                    {_hasRef ? (
                        <>
                            <View
                                style={[
                                    s.seg,
                                    { width: Math.max(0, leftW), backgroundColor: YELLOW },
                                ]}
                            />
                            <View
                                style={[
                                    s.seg,
                                    { width: Math.max(0, midW), backgroundColor: GREEN },
                                ]}
                            />
                            <View
                                style={[
                                    s.seg,
                                    { width: Math.max(0, rightW), backgroundColor: RED },
                                ]}
                            />
                        </>
                    ) : (
                        <View style={[s.seg, { width: widthPx, backgroundColor: GRAY }]} />
                    )}
                    <View
                        style={[
                            s.marker,
                            {
                                left: Math.max(
                                    0,
                                    Math.min(widthPx - 4 * w1px, markerLeft - 2 * w1px),
                                ),
                                backgroundColor: flagColor,
                            },
                        ]}
                    />
                </View>
                </View>

                {/* Durum rozeti */}
                <View style={s.statusPillWrapper}>
                <View style={[s.statusPill, { backgroundColor: bgColor }]}>
                    <T size={fontSize.body} weight="700" color={flagColor}>
                        {flagText}
                    </T>
                </View>
                </View>
            </View>
        );
    };

    return (
        <View style={{ paddingVertical: 4 * h1px }}>
            {filtered.map((item, idx) => (
                <RangeRow key={`${item.test}-${idx}`} item={item} />
            ))}
        </View>
    );
};

export default Chart;
