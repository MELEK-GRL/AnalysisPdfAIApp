import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useResponsive } from '../../utils/deviceStore/device';
import { getLabHistory, getLabHistoryItem, deleteLabHistoryItem, deleteAllLabHistory, LabHistoryItem, LabHistoryDetail } from '../../server/api/Lab';
import { useT, useLocaleStore } from '../../store/useLocaleStore';
import { useSessionStore } from '../../store/useSessionStore';
import { useScreenTime } from '../../utils/analytics/useScreenTime';
import { isNetworkError } from '../../utils/errorUtils';
import { getProfile } from '../../server/api/User';
import { getToken } from '../../server/apiFetcher';
import Header from '../../components/Header/Header';
import PageHeader from '../../components/PageHeader/PageHeader';
import PageLayout from '../../components/Layout/PageLayout';
import T from '../../components/Text/T';
import colors from '../../theme/colors';
import { fontSize } from '../../constants/typography';
import { iconSize } from '../../constants/icons';
import CenterModal from '../../components/Modals/CenterModal';
import PopupModal from '../../components/Modals/PopupModal';
import Chart from '../../components/Chart/Chart';
import EmptyState from '../../components/EmptyState/EmptyState';
import AnalysisContent from '../../components/AnalysisContent/AnalysisContent';

const History: React.FC = () => {
    useScreenTime('History');
    const [items, setItems] = useState<LabHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [detailModal, setDetailModal] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState<LabHistoryDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [errorVisible, setErrorVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [errorSource, setErrorSource] = useState<'fetch' | 'detail'>('fetch');
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
    const [deleteAllConfirmVisible, setDeleteAllConfirmVisible] = useState(false);
    const [deleteSelectedConfirmVisible, setDeleteSelectedConfirmVisible] = useState(false);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [detailTab, setDetailTab] = useState<'values' | 'analysis'>('values');
    const t = useT();
    const locale = useLocaleStore((s) => s.locale);
    const { w1px, h1px, fs1px } = useResponsive();

    const fetchHistory = useCallback(async () => {
        try {
            const token = await getToken();
            const [history, me] = await Promise.all([
                getLabHistory(),
                token ? getProfile().catch(() => null) : Promise.resolve(null),
            ]);
            const onlyLabReports = (history ?? []).filter((it) => (it.itemCount ?? 0) > 0);
            const sorted = [...onlyLabReports].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            );
            setItems(sorted);
            if (me?.name) setDisplayName(me.name);
        } catch (e) {
            const msg = isNetworkError(e)
                ? t('history.fetchErrorNetwork')
                : t('history.fetchErrorServer');
            setErrorMessage(msg);
            setErrorSource('fetch');
            setErrorVisible(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [t]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    useFocusEffect(
        useCallback(() => {
            useSessionStore.getState().touch();
            fetchHistory();
        }, [fetchHistory]),
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchHistory();
    }, [fetchHistory]);

    const handleRetry = useCallback(() => {
        setErrorVisible(false);
        setLoading(true);
        fetchHistory();
    }, [fetchHistory]);

    const handleItemPress = useCallback(async (id: string) => {
        setDetailLoading(true);
        setDetailModal(true);
        setSelectedDetail(null);
        setDetailTab('values');
        try {
            const detail = await getLabHistoryItem(id);
            setSelectedDetail(detail);
        } catch (e) {
            setErrorMessage(t('history.detailError'));
            setErrorSource('detail');
            setErrorVisible(true);
        } finally {
            setDetailLoading(false);
        }
    }, [t]);

    const formatDate = (s: string) => {
        const d = new Date(s);
        const localeTag = locale === 'en' ? 'en-US' : 'tr-TR';
        return d.toLocaleDateString(localeTag, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return items;
        const q = searchQuery.trim().toLowerCase();
        return items.filter(
            (it) => (it.pdfName ?? '').toLowerCase().includes(q),
        );
    }, [items, searchQuery]);

    const toggleSelection = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const exitSelectionMode = useCallback(() => {
        setSelectionMode(false);
        setSelectedIds(new Set());
    }, []);

    const handleDeleteSelectedConfirm = useCallback(async () => {
        setDeleteSelectedConfirmVisible(false);
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;
        try {
            for (const id of ids) {
                await deleteLabHistoryItem(id);
            }
            setItems((prev) => prev.filter((i) => !selectedIds.has(i.id)));
            if (selectedDetail && selectedIds.has(selectedDetail.id)) {
                setDetailModal(false);
                setSelectedDetail(null);
            }
            exitSelectionMode();
        } catch (err) {
            setErrorMessage(t('history.fetchErrorServer'));
            setErrorSource('fetch');
            setErrorVisible(true);
        }
    }, [selectedIds, selectedDetail, t]);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                contentView: { flex: 1, backgroundColor: colors.white },
                scrollView: { flex: 1 },
                empty: {
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 40 * h1px,
                },
                card: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.white,
                    borderRadius: 12 * w1px,
                    paddingVertical: 12 * h1px,
                    paddingHorizontal: 12 * w1px,
                    marginBottom: 10 * h1px,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                    elevation: 2,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                },
                cardContent: {
                    flex: 1,
                    minWidth: 0,
                },
                cardTitle: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4 * h1px,
                },
                cardChevron: {
                    marginLeft: 8 * w1px,
                },
                detailDateRow: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12 * h1px,
                    gap: 12 * w1px,
                },
                detailModalView: {
                    height: h1px * 500,
                    width: '100%',
                    paddingHorizontal: 12 * w1px,
                },
                pill: {
                    alignSelf: 'flex-start',
                    backgroundColor: '#F3F4F6',
                    borderRadius: 999,
                    paddingVertical: 4 * h1px,
                    paddingHorizontal: 10 * w1px,
                    marginBottom: 8 * h1px,
                },
                sectionGap: { height: 12 * h1px },
                searchWrap: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    height: 48 * h1px,
                    backgroundColor: colors.white,
                    borderRadius: 14 * w1px,
                    marginBottom: 14 * h1px,
                    paddingHorizontal: 16 * w1px,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.04,
                    shadowRadius: 8,
                    elevation: 2,
                },
                searchIcon: {
                    marginRight: 12 * w1px,
                },
                searchInput: {
                    flex: 1,
                    height: '100%',
                    fontSize: 15,
                    color: '#111827',
                    paddingVertical: 0,
                },
                deleteAllRow: {
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: 10 * w1px,
                    marginBottom: 12 * h1px,
                },
                deleteButton: {
                    backgroundColor: colors.white,
                    borderWidth: 1.5,
                    borderColor: colors.backgroundPurple,
                    borderRadius: 10 * w1px,
                    paddingVertical: 10 * h1px,
                    paddingHorizontal: 16 * w1px,
                },
                deleteButtonRed: {
                    backgroundColor: '#DC2626',
                    borderWidth: 0,
                    borderRadius: 10 * w1px,
                    paddingVertical: 10 * h1px,
                    paddingHorizontal: 16 * w1px,
                },
                deleteAllButton: {
                    backgroundColor: colors.white,
                    borderWidth: 1.5,
                    borderColor: colors.backgroundPurple,
                    borderRadius: 10 * w1px,
                    paddingVertical: 10 * h1px,
                    paddingHorizontal: 16 * w1px,
                },
                checkboxWrap: {
                    marginRight: 12 * w1px,
                },
                detailTabRow: {
                    flexDirection: 'row',
                    marginBottom: 16 * h1px,
                    backgroundColor: '#F3F4F6',
                    borderRadius: 10 * w1px,
                    padding: 4 * w1px,
                },
                detailTab: {
                    flex: 1,
                    paddingVertical: 10 * h1px,
                    borderRadius: 8 * w1px,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                detailTabActive: {
                    backgroundColor: colors.white,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.06,
                    shadowRadius: 3,
                    elevation: 2,
                },
                detailTabInactive: {
                    backgroundColor: 'transparent',
                },
            }),
        [w1px, h1px, fs1px],
    );

    const renderItem = ({ item }: { item: LabHistoryItem }) => {
        const isSelected = selectedIds.has(item.id);
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => {
                    if (selectionMode) {
                        toggleSelection(item.id);
                    } else {
                        handleItemPress(item.id);
                    }
                }}
                activeOpacity={0.7}>
                {selectionMode ? (
                    <View style={styles.checkboxWrap}>
                        <Ionicons
                            name={isSelected ? 'checkbox' : 'checkbox-outline'}
                            size={24}
                            color={isSelected ? '#22C55E' : '#9CA3AF'}
                        />
                    </View>
                ) : null}
                <View style={styles.cardContent}>
                    <View style={styles.cardTitle}>
                        <T size={fontSize.subtitle} weight="600" color="#111827" numberOfLines={1} style={{ flex: 1 }}>
                            {item.pdfName || t('history.labReport')}
                        </T>
                        <T size={fontSize.bodySmall} color="#9CA3AF" style={{ marginLeft: 8 }}>
                            {formatDate(item.createdAt)}
                        </T>
                    </View>
                    <T size={fontSize.body} color="#6B7280">
                        {item.itemCount > 0
                            ? `${item.itemCount} ${t('history.paramCount')}`
                            : t('history.notLabReport')}
                    </T>
                </View>
                {!selectionMode ? (
                    <Ionicons
                        name="chevron-forward"
                        size={iconSize.medium}
                        color={colors.backgroundPurple}
                        style={styles.cardChevron}
                    />
                ) : null}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.contentView}>
            <Header title={displayName} />
            <PageLayout>
                <PageHeader title={t('tabs.history')} />
                {!loading && items.length > 0 ? (
                    <>
                        <View style={styles.searchWrap}>
                            <Ionicons
                                name="search"
                                size={20}
                                color={colors.backgroundPurple}
                                style={styles.searchIcon}
                            />
                            <TextInput
                                style={styles.searchInput}
                                placeholder={t('history.searchPlaceholder')}
                                placeholderTextColor="#9CA3AF"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                        <View style={styles.deleteAllRow}>
                            {selectionMode ? (
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={exitSelectionMode}
                                    activeOpacity={0.7}>
                                    <T size={fontSize.body} weight="600" color={colors.backgroundPurple}>
                                        {t('common.cancel')}
                                    </T>
                                </TouchableOpacity>
                            ) : null}
                            <TouchableOpacity
                                style={
                                    selectionMode && selectedIds.size > 0
                                        ? styles.deleteButtonRed
                                        : styles.deleteButton
                                }
                                onPress={() => {
                                    if (!selectionMode) {
                                        setSelectionMode(true);
                                    } else if (selectedIds.size > 0) {
                                        setDeleteSelectedConfirmVisible(true);
                                    } else {
                                        exitSelectionMode();
                                    }
                                }}
                                activeOpacity={0.7}>
                                <T
                                    size={fontSize.body}
                                    weight="600"
                                    color={selectionMode && selectedIds.size > 0 ? '#fff' : colors.backgroundPurple}>
                                    {t('common.delete')}
                                </T>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.deleteAllButton}
                                onPress={() => setDeleteAllConfirmVisible(true)}
                                activeOpacity={0.7}>
                                <T size={fontSize.body} weight="600" color={colors.backgroundPurple}>
                                    {t('history.deleteAllButton')}
                                </T>
                            </TouchableOpacity>
                        </View>
                    </>
                ) : null}
                <View style={styles.scrollView}>
                    {loading ? (
                        <View style={styles.empty}>
                            <ActivityIndicator size="large" color={colors.backgroundPurple} />
                            <T size={fontSize.body} color="#6B7280" style={{ marginTop: 12 }}>
                                {t('common.loading')}
                            </T>
                        </View>
                    ) : items.length === 0 ? (
                        <EmptyState
                            title={t('history.emptyTitle')}
                            subtitle={t('history.emptySub')}
                            style={styles.empty}
                        />
                    ) : filteredItems.length === 0 ? (
                        <View style={styles.empty}>
                            <T size={fontSize.body} color="#6B7280">
                                {t('history.emptyTitle')}
                            </T>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredItems}
                            keyExtractor={(it) => it.id}
                            renderItem={renderItem}
                            showsVerticalScrollIndicator={false}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingVertical: 12 }}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={onRefresh}
                                />
                            }
                        />
                    )}
                </View>
            </PageLayout>

            <CenterModal
                visible={detailModal}
                title={selectedDetail?.pdfName || t('history.detailTitle')}
                leftButtonText={t('common.delete')}
                rightButtonText={t('common.close')}
                leftButtonBackgroundColor="#DC2626"
                onLeftPress={() => setDeleteConfirmVisible(true)}
                onRightPress={() => setDetailModal(false)}>
                <ScrollView
                    style={styles.detailModalView}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 24 }}>
                    {detailLoading ? (
                        <ActivityIndicator style={{ marginTop: 40 }} />
                    ) : selectedDetail ? (
                        <>
                            <View style={styles.detailDateRow}>
                                {selectedDetail.patientName?.trim() ? (
                                    <T size={fontSize.body} weight="600" color="#374151" numberOfLines={1} style={{ flex: 1 }}>
                                        {selectedDetail.patientName.trim()}
                                    </T>
                                ) : (
                                    <View style={{ flex: 1 }} />
                                )}
                                <T size={fontSize.body} weight="700" color="#374151">
                                    {formatDate(selectedDetail.createdAt)}
                                </T>
                            </View>
                            <View style={styles.detailTabRow}>
                                <TouchableOpacity
                                    style={[styles.detailTab, detailTab === 'values' ? styles.detailTabActive : styles.detailTabInactive]}
                                    onPress={() => setDetailTab('values')}
                                    activeOpacity={0.7}>
                                    <T
                                        size={fontSize.body}
                                        weight={detailTab === 'values' ? '700' : '500'}
                                        color={detailTab === 'values' ? colors.backgroundPurpleDark : '#6B7280'}>
                                        {t('history.labValues')}
                                    </T>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.detailTab, detailTab === 'analysis' ? styles.detailTabActive : styles.detailTabInactive]}
                                    onPress={() => setDetailTab('analysis')}
                                    activeOpacity={0.7}>
                                    <T
                                        size={fontSize.body}
                                        weight={detailTab === 'analysis' ? '700' : '500'}
                                        color={detailTab === 'analysis' ? colors.backgroundPurpleDark : '#6B7280'}>
                                        {t('history.analysisComment')}
                                    </T>
                                </TouchableOpacity>
                            </View>
                            {detailTab === 'values' ? (
                                selectedDetail.items.length > 0 ? (
                                    <Chart items={selectedDetail.items} />
                                ) : (
                                    <T size={fontSize.body} color="#6B7280">{t('history.noRecord')}</T>
                                )
                            ) : selectedDetail.analysis ? (
                                <AnalysisContent content={selectedDetail.analysis} />
                            ) : (
                                <T size={fontSize.body} color="#6B7280">{t('history.noRecord')}</T>
                            )}
                        </>
                    ) : null}
                </ScrollView>
            </CenterModal>

            <PopupModal
                visible={deleteConfirmVisible}
                title={t('common.warning')}
                message={t('history.deleteConfirmMessage')}
                type="warning"
                leftButtonText={t('common.cancel')}
                rightButtonText={t('common.delete')}
                onLeftPress={() => setDeleteConfirmVisible(false)}
                onRightPress={async () => {
                    setDeleteConfirmVisible(false);
                    if (selectedDetail) {
                        try {
                            await deleteLabHistoryItem(selectedDetail.id);
                            setItems((prev) => prev.filter((i) => i.id !== selectedDetail.id));
                            setDetailModal(false);
                            setSelectedDetail(null);
                        } catch (err) {
                            setErrorMessage(t('history.fetchErrorServer'));
                            setErrorSource('fetch');
                            setErrorVisible(true);
                        }
                    }
                }}
            />

            <PopupModal
                visible={deleteAllConfirmVisible}
                title={t('common.warning')}
                message={t('history.deleteAllConfirm')}
                type="warning"
                leftButtonText={t('common.cancel')}
                rightButtonText={t('common.delete')}
                onLeftPress={() => setDeleteAllConfirmVisible(false)}
                onRightPress={async () => {
                    setDeleteAllConfirmVisible(false);
                    try {
                        await deleteAllLabHistory();
                        setItems([]);
                        setDetailModal(false);
                        setSelectedDetail(null);
                    } catch (err) {
                        setErrorMessage(t('history.fetchErrorServer'));
                        setErrorSource('fetch');
                        setErrorVisible(true);
                    }
                }}
            />

            <PopupModal
                visible={deleteSelectedConfirmVisible}
                title={t('common.warning')}
                message={t('history.deleteSelectedConfirm')}
                type="warning"
                leftButtonText={t('common.cancel')}
                rightButtonText={t('common.delete')}
                onLeftPress={() => setDeleteSelectedConfirmVisible(false)}
                onRightPress={handleDeleteSelectedConfirm}
            />

            <PopupModal
                visible={errorVisible}
                title={t('common.error')}
                message={errorMessage}
                type="error"
                leftButtonText={errorSource === 'fetch' ? t('common.close') : undefined}
                rightButtonText={errorSource === 'fetch' ? t('common.retry') : t('common.ok')}
                onLeftPress={errorSource === 'fetch' ? () => setErrorVisible(false) : undefined}
                onRightPress={errorSource === 'fetch' ? handleRetry : () => setErrorVisible(false)}
            />
        </View>
    );
};

export default History;
