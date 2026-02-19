import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    ScrollView,
} from 'react-native';
import { useResponsive } from '../../utils/deviceStore/device';
import { getLabHistory, getLabHistoryItem, LabHistoryItem, LabHistoryDetail } from '../../server/api/Lab';
import { useLocaleStore } from '../../store/useLocaleStore';
import { useScreenTime } from '../../utils/analytics/useScreenTime';
import { isNetworkError } from '../../utils/errorUtils';
import { getProfile } from '../../server/api/User';
import Header from '../../components/Header/Header';
import PageLayout from '../../components/Layout/PageLayout';
import T from '../../components/Text/T';
import colors from '../../theme/colors';
import CenterModal from '../../components/Modals/CenterModal';
import PopupModal from '../../components/Modals/PopupModal';
import Chart from '../../components/Chart/Chart';

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
    const t = useLocaleStore((s) => s.t);
    const { w1px, h1px, fs1px } = useResponsive();

    const fetchHistory = useCallback(async () => {
        try {
            const [history, me] = await Promise.all([
                getLabHistory(),
                getProfile(),
            ]);
            setItems(history);
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
        return d.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

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
                    backgroundColor: colors.white,
                    borderRadius: 12 * w1px,
                    padding: 16 * w1px,
                    marginHorizontal: 16 * w1px,
                    marginBottom: 12 * h1px,
                    shadowColor: '#000',
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 3,
                },
                cardTitle: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6 * h1px,
                },
                detailModalView: {
                    height: h1px * 500,
                    width: '100%',
                    paddingHorizontal: 12 * w1px,
                },
                pill: {
                    alignSelf: 'flex-start',
                    backgroundColor: '#ECFDF5',
                    borderRadius: 999,
                    paddingVertical: 4 * h1px,
                    paddingHorizontal: 10 * w1px,
                    marginBottom: 8 * h1px,
                },
                sectionGap: { height: 12 * h1px },
            }),
        [w1px, h1px, fs1px],
    );

    const renderItem = ({ item }: { item: LabHistoryItem }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handleItemPress(item.id)}
            activeOpacity={0.8}>
            <View style={styles.cardTitle}>
                <T size={16} weight="600" color="#111827" numberOfLines={1}>
                    {item.pdfName || t('history.labReport')}
                </T>
                <T size={12} color="#6B7280">
                    {formatDate(item.createdAt)}
                </T>
            </View>
            <T size={14} color="#6B7280">
                {item.itemCount > 0
                    ? `${item.itemCount} ${t('history.paramCount')}`
                    : t('history.notLabReport')}
            </T>
        </TouchableOpacity>
    );

    return (
        <View style={styles.contentView}>
            <Header title={displayName} />
            <PageLayout>
                <View style={styles.scrollView}>
                    {loading ? (
                        <View style={styles.empty}>
                            <ActivityIndicator size="large" color={colors.backgroundPurple} />
                            <T size={14} color="#6B7280" style={{ marginTop: 12 }}>
                                {t('common.loading')}
                            </T>
                        </View>
                    ) : items.length === 0 ? (
                        <View style={styles.empty}>
                            <T size={16} weight="600" color="#6B7280">
                                {t('history.emptyTitle')}
                            </T>
                            <T size={14} color="#9CA3AF" style={{ marginTop: 8 }}>
                                {t('history.emptySub')}
                            </T>
                        </View>
                    ) : (
                        <FlatList
                            data={items}
                            keyExtractor={(it) => it.id}
                            renderItem={renderItem}
                            contentContainerStyle={{ paddingVertical: 16 }}
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
                rightButtonText={t('common.close')}
                onRightPress={() => setDetailModal(false)}>
                <ScrollView style={styles.detailModalView}>
                    {detailLoading ? (
                        <ActivityIndicator style={{ marginTop: 40 }} />
                    ) : selectedDetail ? (
                        <>
                            <T size={12} color="#6B7280" style={{ marginBottom: 8 }}>
                                {formatDate(selectedDetail.createdAt)}
                            </T>
                            {selectedDetail.items.length > 0 ? (
                                <>
                                    <View style={styles.pill}>
                                        <T size={12} weight="700" color="#065F46">
                                            {t('history.labValues')}
                                        </T>
                                    </View>
                                    <Chart items={selectedDetail.items} />
                                    <View style={styles.sectionGap} />
                                </>
                            ) : null}
                            {selectedDetail.analysis ? (
                                <>
                                    <View style={styles.pill}>
                                        <T size={12} weight="700" color="#065F46">
                                            {t('history.analysis')}
                                        </T>
                                    </View>
                                    {selectedDetail.analysis
                                        .split(/\n+/)
                                        .map((line, idx) => (
                                            <T
                                                key={idx}
                                                size={14}
                                                color="#111827"
                                                style={{ marginBottom: 6 }}>
                                                {line}
                                            </T>
                                        ))}
                                </>
                            ) : (
                                <T size={14} color="#6B7280">
                                    {t('history.noRecord')}
                                </T>
                            )}
                        </>
                    ) : null}
                </ScrollView>
            </CenterModal>

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
