// src/components/Chart.tsx
import React, { useMemo } from 'react';
import { View, StyleSheet, FlatList, Image } from 'react-native';
import type { LabItem } from '../../server/api/Lab';
import { useResponsive } from '../../utils/deviceStore/device';
import T from '../../components/Text/T';

type Props = { items: LabItem[]; width?: number };

const BLUE = '#3b82f6'; // mavi ok
const YELLOW = '#f59e0b'; // düşük
const GREEN = '#10b981'; // normal
const RED = '#ef4444'; // yüksek
const GRAY = '#E5E7EB'; // referans yoksa tek bant

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

const Chart: React.FC<Props> = ({ items = [], width = 280 }) => {
    const { w1px, h1px, fs1px } = useResponsive();
    const widthPx = width * w1px;

    const s = useMemo(
        () =>
            StyleSheet.create({
                wrap: { paddingVertical: 6 * h1px, flex: 1 },

                top: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                },

                bar: {
                    height: 14 * h1px,
                    borderRadius: 8 * w1px,
                    backgroundColor: '#F3F4F6',
                    marginTop: 6 * h1px,
                    position: 'relative',
                    overflow: 'hidden',
                    flexDirection: 'row',
                },
                seg: { height: '100%' },

                markerLine: {
                    position: 'absolute',
                    width: 2 * w1px,
                    top: 0,
                    bottom: 14 * h1px,
                    borderRadius: 2 * w1px,
                },
                markerArrow: {
                    position: 'absolute',
                    top: -1 * h1px,
                    width: 0,
                    height: 0,
                    borderLeftWidth: 12 * w1px,
                    borderRightWidth: 12 * w1px,
                    borderTopWidth: 12 * h1px,
                    borderLeftColor: 'transparent',
                    borderRightColor: 'transparent',
                },

                labelsWrap: {
                    position: 'relative',
                    height: 16 * h1px,
                    marginTop: 4 * h1px,
                },

                bottom: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginTop: 6 * h1px,
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
            if (!name || name.length < 2) {
                return false;
            }
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
                <T size={16 * fs1px} weight="700" color="#6B7280">
                    Veri Bulunmamaktadır
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
        const flagText =
            flag === 'L' ? 'Düşük' : flag === 'H' ? 'Yüksek' : 'Normal';
        const flagColor = flag === 'H' ? RED : flag === 'L' ? YELLOW : GREEN;

        return (
            <View style={s.wrap}>
                <View style={s.top}>
                    <T
                        size={14}
                        weight="600"
                        color="#111827"
                        numberOfLines={1}
                        style={{ flex: 1, paddingRight: 8 * w1px }}>
                        {item.label || item.test}
                    </T>
                    <T size={14} weight="700" color={flagColor}>
                        {fmtNum(v)}
                        {item.unit ? ` ${item.unit}` : ''}
                    </T>
                </View>

                {/* Bar */}
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

                    {/* Mavi çizgi */}
                    <View
                        style={[
                            s.markerLine,
                            {
                                left: Math.max(
                                    0,
                                    Math.min(widthPx - 2 * w1px, markerLeft - 1 * w1px),
                                ),
                                backgroundColor: BLUE,
                            },
                        ]}
                    />
                    {/* Mavi ok */}

                    <View
                        style={[
                            s.markerArrow,
                            {
                                left: Math.max(
                                    2 * w1px,
                                    Math.min(widthPx - 20 * w1px, markerLeft - 6 * w1px),
                                ),
                                borderTopColor: BLUE,
                            },
                        ]}
                    />
                </View>

                {/* Alt etiketler */}
                <View style={[s.labelsWrap, { width: widthPx }]}>
                    <T size={14} color="#6B7280" style={{ position: 'absolute', left: 0 }}>
                        {fmtNum(scaleMin)}
                    </T>
                    {_hasRef && (
                        <>
                            <T
                                size={14}
                                color="#6B7280"
                                style={{
                                    position: 'absolute',
                                    left: Math.max(0, toPx(refLow) + 30 * w1px),
                                }}>
                                {fmtNum(refLow)}
                            </T>
                            <T
                                size={14}
                                color="#6B7280"
                                style={{
                                    position: 'absolute',
                                    left: Math.max(0, toPx(refHigh) + 10 * w1px),
                                }}>
                                {fmtNum(refHigh)}
                            </T>
                        </>
                    )}
                    <T
                        size={14}
                        color="#6B7280"
                        style={{ position: 'absolute', right: 0, textAlign: 'right' }}>
                        {fmtNum(scaleMax)}
                    </T>
                </View>

                <View style={s.bottom}>
                    <T size={14} color="#6B7280">
                        Ref: {_hasRef ? `${fmtNum(refLow)}–${fmtNum(refHigh)}` : '—'}
                        {item.unit ? ` ${item.unit}` : ''}
                    </T>
                    <T size={14} weight="700" color={flagColor}>
                        {flagText}
                    </T>
                </View>
            </View>
        );
    };

    if (filtered.length === 1) {
        return <RangeRow item={filtered[0]} />;
    }

    return (
        <FlatList
            data={filtered}
            keyExtractor={(it, idx) => `${it.test}-${idx}`}
            renderItem={({ item }) => <RangeRow item={item} />}
            ItemSeparatorComponent={() => <View style={{ height: 10 * h1px }} />}
            contentContainerStyle={{ paddingVertical: 4 * h1px }}
            showsVerticalScrollIndicator={false}
        />
    );
};

export default Chart;
