import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useResponsive } from '../../utils/deviceStore/device';
import T from '../Text/T';
import colors from '../../theme/colors';
import { fontSize } from '../../constants/typography';
import { iconSize } from '../../constants/icons';
import SegmentedTabs from '../SegmentedTabs/SegmentedTabs';
import EmptyState from '../EmptyState/EmptyState';
import Badge from '../Badge/Badge';
import { useT } from '../../store/useLocaleStore';
import { filterNotableCompareItems } from '../../utils/labNotable';
import type { LabComparisonResult, LabCompareCommonItem } from '../../server/api/Lab';

type Props = {
    comparison: LabComparisonResult;
};

type CompareTab = 'compare' | 'notable';

const PAGE_SIZE = 10;

function formatDate(s: string | null | undefined, locale: string) {
    if (!s) return '—';
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'tr-TR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/** Sayısal sonuç + birim; kategorikse resultLabel. Durum (Normal/Yüksek) buraya yazılmaz. */
function formatValue(v: number | null | undefined, unit?: string | null, resultLabel?: string | null) {
    if (v != null && Number.isFinite(Number(v))) {
        const n = Number(v);
        const text = Number.isInteger(n) ? String(n) : String(Math.round(n * 1000) / 1000);
        return unit ? `${text} ${unit}` : text;
    }
    if (resultLabel) return String(resultLabel);
    return '—';
}

/** PDF adını göster; yoksa yedek etiket. Uzun adları kısalt. */
function labName(pdfName: string | null | undefined, fallback: string, maxLen = 36) {
    const raw = (pdfName || '').trim() || fallback;
    if (raw.length <= maxLen) return raw;
    return `${raw.slice(0, Math.max(8, maxLen - 1))}…`;
}

const LabCompareResult: React.FC<Props> = ({ comparison }) => {
    const t = useT();
    const { w1px, h1px } = useResponsive();
    const [tab, setTab] = useState<CompareTab>('compare');
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const name1 = labName(comparison.lab1.pdfName, '1. Tahlil');
    const name2 = labName(comparison.lab2.pdfName, '2. Tahlil');
    const name1Short = labName(comparison.lab1.pdfName, '1. Tahlil', 18);
    const name2Short = labName(comparison.lab2.pdfName, '2. Tahlil', 18);

    const notableItems = useMemo(
        () => filterNotableCompareItems(comparison.common),
        [comparison.common],
    );

    const listItems = tab === 'notable' ? notableItems : comparison.common;
    const totalItems = listItems.length;
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const visibleItems = useMemo(
        () => listItems.slice(0, Math.min(visibleCount, totalItems)),
        [listItems, visibleCount, totalItems],
    );
    const hasMore = visibleCount < totalItems;
    const showMore = () =>
        setVisibleCount(c => Math.min(c + PAGE_SIZE, totalItems));

    // Tab veya liste değişince 10'dan başla (analiz detayı Chart ile aynı)
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [tab, totalItems, comparison.lab1.id, comparison.lab2.id]);

    const tabs = useMemo(
        () => [
            {
                key: 'compare' as const,
                label: t('history.compareTabCompare'),
                icon: 'git-compare-outline',
            },
            {
                key: 'notable' as const,
                label: t('history.compareTabNotable'),
                icon: 'alert-circle-outline',
                badge: notableItems.length,
                tone: 'alert' as const,
            },
        ],
        [t, notableItems.length],
    );

    const styles = useMemo(
        () =>
            StyleSheet.create({
                root: { width: '100%', flex: 1 },
                scroll: { flex: 1, width: '100%' },
                headerBlock: {
                    backgroundColor: colors.backgroundPurpleSoft,
                    borderRadius: 10 * w1px,
                    padding: 12 * w1px,
                    marginBottom: 12 * h1px,
                    borderWidth: 1,
                    borderColor: 'rgba(116, 83, 224, 0.12)',
                    width: '100%',
                },
                summaryCard: {
                    flexDirection: 'row',
                    alignItems: 'stretch',
                    gap: 8 * w1px,
                    marginBottom: 12 * h1px,
                    width: '100%',
                },
                summaryCell: {
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6 * w1px,
                    paddingVertical: 6 * h1px,
                    paddingHorizontal: 8 * w1px,
                    borderRadius: 8 * w1px,
                    borderWidth: 1,
                },
                summaryCellCommon: {
                    backgroundColor: colors.backgroundPurpleSoft,
                    borderColor: 'rgba(116, 83, 224, 0.18)',
                },
                summaryCellNotable: {
                    backgroundColor: colors.dangerSoft,
                    borderColor: 'rgba(220, 38, 38, 0.14)',
                },
                summaryCellNotableMuted: {
                    backgroundColor: '#F3F4F6',
                    borderColor: '#E5E7EB',
                },
                summaryNumWrap: {
                    minWidth: 24 * w1px,
                    height: 24 * w1px,
                    borderRadius: 6 * w1px,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.white,
                },
                summaryTextCol: {
                    flex: 1,
                    minWidth: 0,
                    justifyContent: 'center',
                },
                tabsWrap: {
                    width: '100%',
                    marginBottom: 12 * h1px,
                },
                card: {
                    width: '100%',
                    backgroundColor: colors.white,
                    borderRadius: 10 * w1px,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    padding: 12 * w1px,
                    marginBottom: 8 * h1px,
                },
                cardHeader: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8 * w1px,
                },
                cardHeaderRight: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6 * w1px,
                    flexShrink: 0,
                },
                detailBox: {
                    marginTop: 10 * h1px,
                    paddingTop: 10 * h1px,
                    borderTopWidth: 1,
                    borderTopColor: '#F3F4F6',
                },
                barTrack: {
                    height: 10 * h1px,
                    borderRadius: 6 * w1px,
                    backgroundColor: '#F3F4F6',
                    overflow: 'hidden',
                    marginTop: 8 * h1px,
                    position: 'relative',
                },
                barRef: {
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(34, 197, 94, 0.25)',
                },
                emptyBox: {
                    width: '100%',
                    paddingVertical: 20 * h1px,
                    paddingHorizontal: 8 * w1px,
                    alignItems: 'center',
                },
            }),
        [w1px, h1px],
    );

    const toggle = (key: string) => {
        setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const renderMiniChart = (item: LabCompareCommonItem) => {
        const v1 = item.lab1.value;
        const v2 = item.lab2.value;
        if (v1 == null || v2 == null || item.unitMismatch) return null;
        const low = item.lab1.refLow ?? item.lab2.refLow;
        const high = item.lab1.refHigh ?? item.lab2.refHigh;
        const vals = [v1, v2];
        if (low != null) vals.push(low);
        if (high != null) vals.push(high);
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const span = max - min || 1;
        const pct = (v: number) => `${((v - min) / span) * 100}%`;
        const refLeft =
            low != null && high != null ? ((low - min) / span) * 100 : null;
        const refWidth =
            low != null && high != null ? ((high - low) / span) * 100 : null;

        return (
            <View style={styles.detailBox}>
                <T size={fontSize.label} color="#6B7280" style={{ marginBottom: 4 }}>
                    {name1Short}: {formatValue(v1, item.lab1.unit)} · {name2Short}:{' '}
                    {formatValue(v2, item.lab2.unit)}
                </T>
                <View style={styles.barTrack}>
                    {refLeft != null && refWidth != null ? (
                        <View
                            style={[
                                styles.barRef,
                                { left: `${refLeft}%`, width: `${Math.max(refWidth, 2)}%` },
                            ]}
                        />
                    ) : null}
                    <View
                        style={{
                            position: 'absolute',
                            left: pct(v1),
                            top: 1,
                            width: 4,
                            height: 8 * h1px,
                            marginLeft: -2,
                            backgroundColor: colors.backgroundPurple,
                            borderRadius: 2,
                        }}
                    />
                    <View
                        style={{
                            position: 'absolute',
                            left: pct(v2),
                            top: 1,
                            width: 4,
                            height: 8 * h1px,
                            marginLeft: -2,
                            backgroundColor: colors.danger,
                            borderRadius: 2,
                        }}
                    />
                </View>
                {low != null && high != null ? (
                    <T size={fontSize.label} color="#9CA3AF" style={{ marginTop: 4 }}>
                        Ref: {low} – {high}
                    </T>
                ) : null}
            </View>
        );
    };

    const resolveTrend = (item: LabCompareCommonItem) => {
        if (item.trend === 'up' || item.trend === 'down' || item.trend === 'flat') {
            return {
                trend: item.trend,
                label: item.percentChangeLabel || item.trendLabel,
            };
        }
        const d = item.diff;
        if (d == null || !Number.isFinite(d)) {
            return { trend: null as 'up' | 'down' | 'flat' | null, label: item.percentChangeLabel };
        }
        if (d > 0) {
            return {
                trend: 'up' as const,
                label: item.percentChangeLabel?.includes('Artış')
                    ? item.percentChangeLabel
                    : `Artış (${item.percentChangeLabel || `+${d}`})`,
            };
        }
        if (d < 0) {
            return {
                trend: 'down' as const,
                label: item.percentChangeLabel?.includes('Düşüş')
                    ? item.percentChangeLabel
                    : `Düşüş (${item.percentChangeLabel || String(d)})`,
            };
        }
        return {
            trend: 'flat' as const,
            label: item.percentChangeLabel || 'Değişmedi',
        };
    };

    const renderItemCard = (item: LabCompareCommonItem) => {
        const open = !!expanded[item.matchKey];
        const v1 = formatValue(item.lab1.value, item.lab1.unit, item.lab1.resultLabel);
        const v2 = formatValue(item.lab2.value, item.lab2.unit, item.lab2.resultLabel);
        const { trend, label: trendDisplay } = resolveTrend(item);
        const badgeTone =
            trend === 'up' ? 'danger' : trend === 'down' ? 'info' : 'neutral';
        const badgeIcon =
            trend === 'up'
                ? 'trending-up'
                : trend === 'down'
                  ? 'trending-down'
                  : 'remove-outline';
        return (
            <TouchableOpacity
                key={item.matchKey}
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => toggle(item.matchKey)}>
                <View style={styles.cardHeader}>
                    <T
                        size={fontSize.bodySmall}
                        weight="700"
                        color={colors.textDark}
                        style={{ flex: 1, minWidth: 0 }}
                        numberOfLines={2}>
                        {item.name}
                    </T>
                    <View style={styles.cardHeaderRight}>
                        {trendDisplay ? (
                            <Badge
                                label={trendDisplay}
                                tone={badgeTone}
                                icon={badgeIcon}
                            />
                        ) : null}
                        <Ionicons
                            name={open ? 'chevron-up' : 'chevron-down'}
                            size={iconSize.small}
                            color={colors.backgroundPurple}
                        />
                    </View>
                </View>
                <View style={{ marginTop: 8 * h1px, gap: 6 * h1px }}>
                    <View>
                        <T
                            size={fontSize.label}
                            color={colors.backgroundPurple}
                            numberOfLines={1}>
                            {name1}
                        </T>
                        <T size={fontSize.bodySmall} color={colors.textDark}>
                            {v1}
                            {item.lab1.status ? ` · ${item.lab1.status}` : ''}
                        </T>
                    </View>
                    <View>
                        <T
                            size={fontSize.label}
                            color={colors.backgroundPurple}
                            numberOfLines={1}>
                            {name2}
                        </T>
                        <T size={fontSize.bodySmall} color={colors.textDark}>
                            {v2}
                            {item.lab2.status ? ` · ${item.lab2.status}` : ''}
                        </T>
                    </View>
                </View>
                {item.unitMismatch || item.note ? (
                    <T
                        size={fontSize.label}
                        color={colors.dangerText}
                        style={{ marginTop: 4 }}>
                        {item.note}
                    </T>
                ) : null}
                {item.transition ? (
                    <T size={fontSize.label} color="#6B7280" style={{ marginTop: 4 }}>
                        Durum: {item.transition}
                    </T>
                ) : null}
                {open ? renderMiniChart(item) : null}
            </TouchableOpacity>
        );
    };

    const emptyMessage =
        tab === 'notable'
            ? t('history.compareNotableEmpty')
            : t('history.compareCommonEmpty');

    const showEmpty =
        tab === 'notable'
            ? notableItems.length === 0
            : comparison.noCommon || comparison.common.length === 0;

    return (
        <View style={styles.root}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={{ paddingBottom: 8 * h1px }}
                showsVerticalScrollIndicator={false}>
                <View style={styles.headerBlock}>
                    <T
                        size={fontSize.body}
                        weight="500"
                        color={colors.textDark}
                        numberOfLines={2}>
                        {comparison.lab1.pdfName?.trim() || name1}
                    </T>
                    <T size={fontSize.captionLarge} weight="400" color="#6B7280">
                        {formatDate(comparison.lab1.createdAt, 'tr')}
                    </T>
                    <View style={{ height: 8 * h1px }} />
                    <T
                        size={fontSize.body}
                        weight="500"
                        color={colors.textDark}
                        numberOfLines={2}>
                        {comparison.lab2.pdfName?.trim() || name2}
                    </T>
                    <T size={fontSize.captionLarge} weight="400" color="#6B7280">
                        {formatDate(comparison.lab2.createdAt, 'tr')}
                    </T>
                </View>

                <View style={styles.summaryCard}>
                    <View style={[styles.summaryCell, styles.summaryCellCommon]}>
                        <View style={styles.summaryNumWrap}>
                            <T size={fontSize.bodyMedium} weight="700" color={colors.backgroundPurple}>
                                {comparison.summary.commonCount}
                            </T>
                        </View>
                        <View style={styles.summaryTextCol}>
                            <T
                                size={fontSize.bodySmall}
                                weight="500"
                                color={colors.textDark}
                                numberOfLines={2}>
                                {t('history.compareSummaryCommon')}
                            </T>
                        </View>
                    </View>
                    <View
                        style={[
                            styles.summaryCell,
                            notableItems.length > 0
                                ? styles.summaryCellNotable
                                : styles.summaryCellNotableMuted,
                        ]}>
                        <View style={styles.summaryNumWrap}>
                            <T
                                size={fontSize.bodyMedium}
                                weight="700"
                                color={
                                    notableItems.length > 0
                                        ? colors.danger
                                        : colors.textGraySoft
                                }>
                                {notableItems.length}
                            </T>
                        </View>
                        <View style={styles.summaryTextCol}>
                            <T
                                size={fontSize.bodySmall}
                                weight="500"
                                color={colors.textDark}
                                numberOfLines={2}>
                                {t('history.compareSummaryNotable')}
                            </T>
                        </View>
                    </View>
                </View>

                <SegmentedTabs
                    items={tabs}
                    value={tab}
                    onChange={setTab}
                    style={styles.tabsWrap}
                />

                {showEmpty ? (
                    <View style={styles.emptyBox}>
                        <EmptyState title={emptyMessage} />
                    </View>
                ) : (
                    <>
                        {visibleItems.map(renderItemCard)}
                        {hasMore ? (
                            <TouchableOpacity
                                onPress={showMore}
                                activeOpacity={0.7}
                                style={{
                                    marginTop: 4 * h1px,
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
                                <T
                                    size={fontSize.body}
                                    weight="600"
                                    color={colors.backgroundPurple}>
                                    {t('history.showMore')}
                                </T>
                            </TouchableOpacity>
                        ) : null}
                    </>
                )}
            </ScrollView>
        </View>
    );
};

export default LabCompareResult;
