import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useResponsive } from '../../utils/deviceStore/device';
import {
    getLabHistory,
    deleteLabHistoryItem,
    deleteAllLabHistory,
    compareLabs,
    getAdsStatus,
    LabHistoryItem,
    LabComparisonResult,
} from '../../server/api/Lab';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HistoryStackParamList } from '../../navigation/historyNavigation';
import { useT, useLocaleStore } from '../../store/useLocaleStore';
import { useSessionStore } from '../../store/useSessionStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useAnalysisLoadingStore } from '../../store/useAnalysisLoadingStore';
import { useScreenTime } from '../../utils/analytics/useScreenTime';
import { isNetworkError } from '../../utils/errorUtils';
import { getProfile } from '../../server/api/User';
import { getToken } from '../../server/apiFetcher';
import { showRewardedAdForCompareUnlock } from '../../utils/ads/rewardedAd';
import { waitForPopupClose } from '../../utils/waitForPopupClose';
import { TEST_REWARDED_UNIT_ID } from '../../constants/limits';
import Header from '../../components/Header/Header';
import PageHeader from '../../components/PageHeader/PageHeader';
import PageLayout from '../../components/Layout/PageLayout';
import T from '../../components/Text/T';
import colors from '../../theme/colors';
import { useTypography } from '../../theme/useTypography';
import { fontSize } from '../../constants/typography';
import { iconSize } from '../../constants/icons';
import PopupModal from '../../components/Modals/PopupModal';
import CenterModal from '../../components/Modals/CenterModal';
import LabCompareResult from '../../components/LabCompare/LabCompareResult';
import EmptyState from '../../components/EmptyState/EmptyState';

const History: React.FC = () => {
    useScreenTime('History');
    const navigation =
        useNavigation<NativeStackNavigationProp<HistoryStackParamList>>();
    const [items, setItems] = useState<LabHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const user = useAuthStore(s => s.user);
    const [displayName, setDisplayName] = useState(user?.name || '');
    const [errorVisible, setErrorVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [errorSource, setErrorSource] = useState<'fetch' | 'detail'>('fetch');
    const [deleteAllConfirmVisible, setDeleteAllConfirmVisible] = useState(false);
    const [deleteSelectedConfirmVisible, setDeleteSelectedConfirmVisible] = useState(false);
    const [selectionMode, setSelectionMode] = useState(false);
    const [compareMode, setCompareMode] = useState(false);
    /** Silme seçimi */
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    /** Karşılaştırma seçim sırası (en fazla 2) */
    const [compareOrder, setCompareOrder] = useState<string[]>([]);
    const [compareLoading, setCompareLoading] = useState(false);
    const [compareResult, setCompareResult] = useState<LabComparisonResult | null>(null);
    const [compareModalVisible, setCompareModalVisible] = useState(false);
    /** Karşılaştır → zorunlu reklam izle popup */
    const [compareAdPromptVisible, setCompareAdPromptVisible] = useState(false);
    /** Reklam sonrası → sonucu gör popup */
    const [compareViewPromptVisible, setCompareViewPromptVisible] = useState(false);
    const [compareRewardedUnitId, setCompareRewardedUnitId] =
        useState(TEST_REWARDED_UNIT_ID);
    const [searchQuery, setSearchQuery] = useState('');
    const t = useT();
    const locale = useLocaleStore((s) => s.locale);
    const { w1px, h1px, fs1px } = useResponsive();
    const { scale } = useTypography();

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
            if (me?.name) {
                setDisplayName(me.name);
            } else if (useAuthStore.getState().user?.name) {
                setDisplayName(useAuthStore.getState().user!.name);
            }
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
        if (user?.name) setDisplayName(user.name);
    }, [user?.name]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    useFocusEffect(
        useCallback(() => {
            useSessionStore.getState().touch();
            fetchHistory();
        }, [fetchHistory]),
    );

    const listSelectMode = selectionMode || compareMode;
    /** Karşılaştırma için en az 2 tahlil gerekir */
    const canCompare = items.length >= 2;

    const exitSelectionMode = useCallback(() => {
        setSelectionMode(false);
        setCompareMode(false);
        setSelectedIds(new Set());
        setCompareOrder([]);
        setCompareAdPromptVisible(false);
        setCompareViewPromptVisible(false);
    }, []);

    const selectModeRef = useRef({ selectionMode, compareMode });
    selectModeRef.current = { selectionMode, compareMode };
    const exitSelectionModeRef = useRef(exitSelectionMode);
    exitSelectionModeRef.current = exitSelectionMode;
    const fetchHistoryRef = useRef(fetchHistory);
    fetchHistoryRef.current = fetchHistory;

    useEffect(() => {
        if (compareMode && !canCompare) {
            setCompareMode(false);
            setCompareOrder([]);
        }
    }, [compareMode, canCompare]);

    /** Alt menüde Geçmiş'e tekrar basınca karşılaştırma / seçim iptal + liste yenile */
    useEffect(() => {
        const parent = navigation.getParent();
        if (!parent) {
            return undefined;
        }
        return parent.addListener('tabPress', () => {
            const { selectionMode: sel, compareMode: cmp } =
                selectModeRef.current;
            if (sel || cmp) {
                exitSelectionModeRef.current();
            }
            setRefreshing(true);
            void fetchHistoryRef.current();
        });
    }, [navigation]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchHistory();
    }, [fetchHistory]);

    const handleRetry = useCallback(() => {
        setErrorVisible(false);
        setLoading(true);
        fetchHistory();
    }, [fetchHistory]);

    const handleItemPress = useCallback((id: string) => {
        const listItem = items.find((it) => it.id === id);
        const title = listItem?.pdfName?.trim() || t('history.detailTitle');
        navigation.navigate('HistoryDetail', { id, title });
    }, [t, items, navigation]);

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

    const toggleSelection = useCallback(
        (id: string) => {
            if (compareMode) {
                setCompareOrder(prev => {
                    if (prev.includes(id)) return prev.filter(x => x !== id);
                    if (prev.length >= 2) return prev;
                    return [...prev, id];
                });
                return;
            }
            setSelectedIds(prev => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
            });
        },
        [compareMode],
    );

    const enterCompareMode = useCallback(() => {
        setSelectionMode(false);
        setSelectedIds(new Set());
        setCompareOrder([]);
        setCompareMode(true);
    }, []);

    /** Karşılaştır butonu: önce zorunlu reklam popup */
    const openCompareAdPrompt = useCallback(async () => {
        if (compareOrder.length !== 2 || compareLoading) return;
        let adsOn = true;
        let unitId = TEST_REWARDED_UNIT_ID;
        try {
            const status = await getAdsStatus();
            adsOn = status.adsEnabled === true;
            if (!__DEV__ && status.rewardedUnitId) {
                unitId = String(status.rewardedUnitId);
            }
        } catch {
            /* reklam dene */
        }
        setCompareRewardedUnitId(unitId);
        if (adsOn) {
            setCompareAdPromptVisible(true);
        } else {
            // Reklam kapalıysa doğrudan sonucu gör adımına geç
            setCompareViewPromptVisible(true);
        }
    }, [compareOrder.length, compareLoading]);

    /** Reklam İzle → LoadingModal + 1 rewarded */
    const handleWatchCompareAd = useCallback(async () => {
        if (compareLoading) return;
        setCompareAdPromptVisible(false);
        setCompareLoading(true);
        // Popup Modal kapansın, sonra LoadingModal (üst üste binmesin)
        await waitForPopupClose();

        const loadingStore = useAnalysisLoadingStore.getState();
        loadingStore.setAdUiLocked(true);
        loadingStore.acquireHold();
        useSessionStore.getState().touch();

        try {
            // Analiz hakkı YOK — sadece karşılaştırma kilidi açılır
            const watched = await showRewardedAdForCompareUnlock(
                compareRewardedUnitId,
            );
            useAnalysisLoadingStore.getState().setAdUiLocked(true);
            useAnalysisLoadingStore.getState().remountAdLock();
            if (!watched) {
                useAnalysisLoadingStore.getState().setAdUiLocked(false);
                await waitForPopupClose(200);
                setErrorMessage(t('home.adFailed'));
                setErrorSource('detail');
                setErrorVisible(true);
                return;
            }
            useAnalysisLoadingStore.getState().setAdUiLocked(false);
            await waitForPopupClose(200);
            setCompareViewPromptVisible(true);
        } finally {
            useSessionStore.getState().touch();
            const store = useAnalysisLoadingStore.getState();
            store.releaseHold();
            store.setAdUiLocked(false);
            setCompareLoading(false);
        }
    }, [compareLoading, compareRewardedUnitId, t]);

    /** Karşılaştırma sonucunu gör → API + CenterModal */
    const handleViewCompareResult = useCallback(async () => {
        if (compareOrder.length !== 2 || compareLoading) return;
        const [id1, id2] = compareOrder;
        setCompareViewPromptVisible(false);
        setCompareLoading(true);
        await waitForPopupClose();

        const loadingStore = useAnalysisLoadingStore.getState();
        loadingStore.setAdUiLocked(true);
        loadingStore.acquireHold();
        useSessionStore.getState().touch();

        try {
            const result = await compareLabs(id1, id2);
            useAnalysisLoadingStore.getState().setAdUiLocked(false);
            await waitForPopupClose(200);
            setCompareResult(result);
            setCompareModalVisible(true);
        } catch (e: unknown) {
            const ax = e as {
                response?: { status?: number; data?: { message?: string } };
            };
            const status = ax?.response?.status;
            const serverMsg = ax?.response?.data?.message;
            let msg = t('history.compareError');
            if (isNetworkError(e)) {
                msg = t('history.fetchErrorNetwork');
            } else if (serverMsg) {
                msg = serverMsg;
            } else if (status === 404) {
                msg = t('history.compareErrorNotDeployed');
            }
            useAnalysisLoadingStore.getState().setAdUiLocked(false);
            await waitForPopupClose(200);
            setErrorMessage(msg);
            setErrorSource('detail');
            setErrorVisible(true);
        } finally {
            useSessionStore.getState().touch();
            const store = useAnalysisLoadingStore.getState();
            store.releaseHold();
            store.setAdUiLocked(false);
            setCompareLoading(false);
        }
    }, [compareOrder, compareLoading, t]);

    const handleDeleteSelectedConfirm = useCallback(async () => {
        setDeleteSelectedConfirmVisible(false);
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;
        try {
            for (const id of ids) {
                await deleteLabHistoryItem(id);
            }
            setItems((prev) => prev.filter((i) => !selectedIds.has(i.id)));
            exitSelectionMode();
        } catch (err) {
            setErrorMessage(t('history.fetchErrorServer'));
            setErrorSource('fetch');
            setErrorVisible(true);
        }
    }, [selectedIds, t, exitSelectionMode]);

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
                    alignItems: 'stretch',
                    backgroundColor: colors.white,
                    borderRadius: 14 * w1px,
                    paddingVertical: 12 * h1px,
                    paddingHorizontal: 12 * w1px,
                    marginBottom: 10 * h1px,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    overflow: 'hidden',
                },
                cardAccent: {
                    width: 4 * w1px,
                    borderRadius: 999,
                    backgroundColor: colors.backgroundPurple,
                    marginRight: 10 * w1px,
                    alignSelf: 'stretch',
                },
                cardContent: {
                    flex: 1,
                    minWidth: 0,
                    justifyContent: 'center',
                },
                cardTitle: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 8 * w1px,
                    marginBottom: 6 * h1px,
                },
                cardMetaRow: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8 * w1px,
                },
                cardPill: {
                    backgroundColor: colors.backgroundPurpleSoft,
                    borderRadius: 999,
                    paddingVertical: 3 * h1px,
                    paddingHorizontal: 10 * w1px,
                },
                cardChevron: {
                    marginLeft: 8 * w1px,
                    alignSelf: 'center',
                },
                retentionHintWrap: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.backgroundPurpleSoft,
                    borderRadius: 12 * w1px,
                    paddingVertical: 10 * h1px,
                    paddingHorizontal: 12 * w1px,
                    marginBottom: 12 * h1px,
                    borderWidth: 1,
                    borderColor: 'rgba(116, 83, 224, 0.12)',
                },
                retentionHintIcon: {
                    marginRight: 8 * w1px,
                },
                retentionHintText: {
                    flex: 1,
                },
                sectionGap: { height: 12 * h1px },
                searchWrap: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    height: 50 * h1px,
                    backgroundColor: colors.white,
                    borderRadius: 10 * w1px,
                    marginBottom: 14 * h1px,
                    paddingLeft: 20 * w1px,
                    paddingRight: 16 * w1px,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 2,
                },
                searchIcon: {
                    marginRight: 5 * w1px,
                },
                searchInput: {
                    flex: 1,
                    height: '100%',
                    fontSize: fontSize.bodyMedium * scale,
                    color: '#1E293B',
                    paddingVertical: 0,
                },
                searchClear: {
                    padding: 6 * w1px,
                    marginLeft: 2 * w1px,
                },
                deleteAllRow: {
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8 * w1px,
                    marginTop: 8 * h1px,
                    marginBottom: 4 * h1px,
                },
                actionChip: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6 * w1px,
                    minHeight: 36 * h1px,
                    paddingVertical: 8 * h1px,
                    paddingHorizontal: 12 * w1px,
                    borderRadius: 10 * w1px,
                    borderWidth: 1,
                },
                actionChipGhost: {
                    backgroundColor: colors.backgroundPurpleSoft,
                    borderColor: 'rgba(116, 83, 224, 0.18)',
                },
                actionChipOutline: {
                    backgroundColor: colors.white,
                    borderColor: 'rgba(116, 83, 224, 0.28)',
                },
                actionChipDanger: {
                    backgroundColor: colors.danger,
                    borderColor: colors.danger,
                },
                actionChipDangerSoft: {
                    backgroundColor: colors.dangerSoft,
                    borderColor: colors.dangerBorder,
                },
                compareButton: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8 * w1px,
                    marginTop: 10 * h1px,
                    marginBottom: 4 * h1px,
                    minHeight: 44 * h1px,
                    paddingVertical: 10 * h1px,
                    paddingHorizontal: 14 * w1px,
                    borderRadius: 10 * w1px,
                    backgroundColor: colors.backgroundPurpleSoft,
                    borderWidth: 1,
                    borderColor: 'rgba(116, 83, 224, 0.22)',
                },
                compareButtonReady: {
                    backgroundColor: colors.backgroundPurple,
                    borderColor: colors.backgroundPurple,
                },
                compareHint: {
                    marginTop: 8 * h1px,
                    marginBottom: 2 * h1px,
                    textAlign: 'center',
                },
                checkboxWrap: {
                    marginRight: 12 * w1px,
                },
                checkbox: {
                    width: 22 * w1px,
                    height: 22 * w1px,
                    borderRadius: 11 * w1px,
                    borderWidth: 2,
                    borderColor: colors.backgroundPurple,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.white,
                },
                checkboxChecked: {
                    backgroundColor: colors.backgroundPurple,
                    borderColor: colors.backgroundPurple,
                },
            }),
        [w1px, h1px, fs1px, scale],
    );

    const renderItem = ({ item }: { item: LabHistoryItem }) => {
        const isSelected = compareMode
            ? compareOrder.includes(item.id)
            : selectedIds.has(item.id);
        const isLab = item.itemCount > 0;
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => {
                    if (listSelectMode) {
                        toggleSelection(item.id);
                    } else {
                        handleItemPress(item.id);
                    }
                }}
                activeOpacity={0.7}>
                {listSelectMode ? (
                    <View style={styles.checkboxWrap}>
                        <View
                            style={[
                                styles.checkbox,
                                isSelected && styles.checkboxChecked,
                            ]}>
                            {isSelected ? (
                                <Ionicons
                                    name="checkmark"
                                    size={iconSize.small}
                                    color={colors.white}
                                />
                            ) : null}
                        </View>
                    </View>
                ) : (
                    <View style={styles.cardAccent} />
                )}
                <View style={styles.cardContent}>
                    <View style={styles.cardTitle}>
                        <T size={fontSize.bodyMedium} weight="500" color="#111827" numberOfLines={2} style={{ flex: 1 }}>
                            {item.pdfName || t('history.labReport')}
                        </T>
                        <View style={styles.cardPill}>
                            <T size={fontSize.label} weight="700" color={isLab ? colors.backgroundPurple : '#6B7280'}>
                                {isLab
                                    ? `${item.itemCount} ${t('history.paramCount')}`
                                    : t('history.notLabReport')}
                            </T>
                        </View>
                    </View>
                    <View style={styles.cardMetaRow}>
                        <T size={fontSize.bodySmall} color="#6B7280">
                            {formatDate(item.createdAt)}
                        </T>
                    </View>
                </View>
                {!listSelectMode ? (
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
                <View style={styles.retentionHintWrap}>
                    <Ionicons
                        name="information-circle"
                        size={18}
                        color={colors.backgroundPurple}
                        style={styles.retentionHintIcon}
                    />
                    <T
                        size={fontSize.bodySmall}
                        color={colors.backgroundPurpleDark}
                        style={styles.retentionHintText}>
                        {t('history.retentionHint')}
                    </T>
                </View>
                {!loading && items.length > 0 ? (
                    <>
                        <View style={styles.searchWrap}>
                            <Ionicons
                                name="search"
                                size={22}
                                color={colors.backgroundPurple}
                                style={styles.searchIcon}
                            />
                            <TextInput
                                style={styles.searchInput}
                                placeholder={t('history.searchPlaceholder')}
                                placeholderTextColor="#94A3B8"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 ? (
                                <TouchableOpacity
                                    onPress={() => setSearchQuery('')}
                                    style={styles.searchClear}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                    <Ionicons name="close-circle" size={22} color="#94A3B8" />
                                </TouchableOpacity>
                            ) : null}
                        </View>
                        <View style={styles.deleteAllRow}>
                            {listSelectMode ? (
                                <TouchableOpacity
                                    style={[styles.actionChip, styles.actionChipGhost]}
                                    onPress={exitSelectionMode}
                                    activeOpacity={0.75}
                                    accessibilityRole="button"
                                    accessibilityLabel={t('common.cancel')}>
                                    <Ionicons
                                        name="close"
                                        size={iconSize.small}
                                        color={colors.backgroundPurple}
                                    />
                                    <T
                                        size={fontSize.bodySmall}
                                        weight="600"
                                        color={colors.backgroundPurple}>
                                        {t('common.cancel')}
                                    </T>
                                </TouchableOpacity>
                            ) : null}
                            {!compareMode ? (
                                <>
                                    <TouchableOpacity
                                        style={[
                                            styles.actionChip,
                                            selectionMode && selectedIds.size > 0
                                                ? styles.actionChipDanger
                                                : styles.actionChipOutline,
                                        ]}
                                        onPress={() => {
                                            if (!selectionMode) {
                                                setCompareMode(false);
                                                setSelectedIds(new Set());
                                                setSelectionMode(true);
                                            } else if (selectedIds.size > 0) {
                                                setDeleteSelectedConfirmVisible(true);
                                            } else {
                                                exitSelectionMode();
                                            }
                                        }}
                                        activeOpacity={0.75}
                                        accessibilityRole="button"
                                        accessibilityLabel={t('common.delete')}>
                                        <Ionicons
                                            name={
                                                selectionMode && selectedIds.size > 0
                                                    ? 'trash'
                                                    : 'trash-outline'
                                            }
                                            size={iconSize.small}
                                            color={
                                                selectionMode && selectedIds.size > 0
                                                    ? colors.white
                                                    : colors.backgroundPurple
                                            }
                                        />
                                        <T
                                            size={fontSize.bodySmall}
                                            weight="600"
                                            color={
                                                selectionMode && selectedIds.size > 0
                                                    ? colors.white
                                                    : colors.backgroundPurple
                                            }>
                                            {selectionMode && selectedIds.size > 0
                                                ? `${t('common.delete')} (${selectedIds.size})`
                                                : t('common.delete')}
                                        </T>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionChip, styles.actionChipDangerSoft]}
                                        onPress={() => setDeleteAllConfirmVisible(true)}
                                        activeOpacity={0.75}
                                        accessibilityRole="button"
                                        accessibilityLabel={t('history.deleteAllButton')}>
                                        <Ionicons
                                            name="trash-bin-outline"
                                            size={iconSize.small}
                                            color={colors.dangerText}
                                        />
                                        <T
                                            size={fontSize.bodySmall}
                                            weight="600"
                                            color={colors.dangerText}>
                                            {t('history.deleteAllButton')}
                                        </T>
                                    </TouchableOpacity>
                                </>
                            ) : null}
                        </View>
                        {!selectionMode && canCompare ? (
                            <>
                                <TouchableOpacity
                                    style={[
                                        styles.compareButton,
                                        compareMode &&
                                            compareOrder.length === 2 &&
                                            styles.compareButtonReady,
                                    ]}
                                    onPress={() => {
                                        if (!compareMode) {
                                            enterCompareMode();
                                            return;
                                        }
                                        if (compareOrder.length === 2 && !compareLoading) {
                                            void openCompareAdPrompt();
                                        }
                                    }}
                                    activeOpacity={0.8}
                                    disabled={compareLoading}
                                    accessibilityRole="button"
                                    accessibilityLabel={
                                        compareMode && compareOrder.length === 2
                                            ? t('history.compareAction')
                                            : t('history.compareButton')
                                    }>
                                    {compareLoading ? (
                                        <ActivityIndicator
                                            size="small"
                                            color={
                                                compareOrder.length === 2
                                                    ? colors.white
                                                    : colors.backgroundPurple
                                            }
                                        />
                                    ) : (
                                        <Ionicons
                                            name="git-compare-outline"
                                            size={iconSize.medium}
                                            color={
                                                compareMode && compareOrder.length === 2
                                                    ? colors.white
                                                    : colors.backgroundPurple
                                            }
                                        />
                                    )}
                                    <T
                                        size={fontSize.body}
                                        weight="600"
                                        color={
                                            compareMode && compareOrder.length === 2
                                                ? colors.white
                                                : colors.backgroundPurple
                                        }>
                                        {compareMode && compareOrder.length === 2
                                            ? t('history.compareAction')
                                            : t('history.compareButton')}
                                    </T>
                                </TouchableOpacity>
                                {compareMode ? (
                                    <T
                                        size={fontSize.bodySmall}
                                        color={colors.textGraySoft}
                                        style={styles.compareHint}>
                                        {compareOrder.length === 2
                                            ? t('history.compareReadyHint')
                                            : t('history.compareHint').replace(
                                                  '{{count}}',
                                                  String(compareOrder.length),
                                              )}
                                    </T>
                                ) : null}
                            </>
                        ) : null}
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

            <PopupModal
                visible={compareAdPromptVisible}
                title={t('history.compareAdTitle')}
                message={t('history.compareAdMessage')}
                type="warning"
                leftButtonText={t('common.cancel')}
                rightButtonText={t('home.watchAd')}
                onLeftPress={() => setCompareAdPromptVisible(false)}
                onRightPress={() => {
                    void handleWatchCompareAd();
                }}
            />

            <PopupModal
                visible={compareViewPromptVisible}
                title={t('history.compareViewResultTitle')}
                message={t('history.compareViewResultMessage')}
                type="success"
                rightButtonText={t('history.compareViewResultAction')}
                onRightPress={() => {
                    void handleViewCompareResult();
                }}
            />

            <CenterModal
                visible={compareModalVisible}
                title={t('history.compareTitle')}
                rightButtonText={t('history.compareClose')}
                onRightPress={() => {
                    setCompareModalVisible(false);
                    setCompareResult(null);
                }}
                fixedHeight>
                {compareResult ? (
                    <LabCompareResult comparison={compareResult} />
                ) : null}
            </CenterModal>
        </View>
    );
};

export default History;
