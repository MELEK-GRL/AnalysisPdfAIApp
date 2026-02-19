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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useResponsive } from '../../utils/deviceStore/device';
import { getLabHistory, getLabHistoryItem, LabHistoryItem, LabHistoryDetail } from '../../server/api/Lab';
import { useT, useLocaleStore } from '../../store/useLocaleStore';
import { useScreenTime } from '../../utils/analytics/useScreenTime';
import { isNetworkError } from '../../utils/errorUtils';
import { getProfile } from '../../server/api/User';
import Header from '../../components/Header/Header';
import PageLayout from '../../components/Layout/PageLayout';
import T from '../../components/Text/T';
import colors from '../../theme/colors';
import { fontSize } from '../../constants/typography';
import { iconSize } from '../../constants/icons';
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
    const t = useT();
    const locale = useLocaleStore((s) => s.locale);
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

    useFocusEffect(
        useCallback(() => {
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
                    marginHorizontal: 8 * w1px,
                    marginBottom: 10 * h1px,
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowRadius: 6,
                    elevation: 2,
                    borderWidth: 1,
                    borderColor: '#F3F4F6',
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
            }),
        [w1px, h1px, fs1px],
    );

    const renderItem = ({ item }: { item: LabHistoryItem }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handleItemPress(item.id)}
            activeOpacity={0.7}>
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
            <Ionicons
                name="chevron-forward"
                size={iconSize.medium}
                color={colors.backgroundPurple}
                style={styles.cardChevron}
            />
        </TouchableOpacity>
    );

    return (
        <View style={styles.contentView}>
            <Header title={displayName} />
            <PageLayout paddingHorizontal={10}>
                <View style={styles.scrollView}>
                    {loading ? (
                        <View style={styles.empty}>
                            <ActivityIndicator size="large" color={colors.backgroundPurple} />
                            <T size={fontSize.body} color="#6B7280" style={{ marginTop: 12 }}>
                                {t('common.loading')}
                            </T>
                        </View>
                    ) : items.length === 0 ? (
                        <View style={styles.empty}>
                            <T size={fontSize.subtitle} weight="600" color="#6B7280">
                                {t('history.emptyTitle')}
                            </T>
                            <T size={fontSize.body} color="#9CA3AF" style={{ marginTop: 8 }}>
                                {t('history.emptySub')}
                            </T>
                        </View>
                    ) : (
                        <FlatList
                            data={items}
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
                rightButtonText={t('common.close')}
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
                            <T size={fontSize.label} color="#6B7280" style={{ marginBottom: 8 }}>
                                {formatDate(selectedDetail.createdAt)}
                            </T>
                            {selectedDetail.items.length > 0 ? (
                                <>
                                    <View style={styles.pill}>
                                        <T size={fontSize.label} weight="700" color="#111827">
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
                                        <T size={fontSize.label} weight="700" color="#111827">
                                            {t('history.analysis')}
                                        </T>
                                    </View>
                                    {selectedDetail.analysis
                                        .split(/\n+/)
                                        .map((line, idx) => (
                                            <T
                                                key={idx}
                                                size={fontSize.body}
                                                color="#111827"
                                                style={{ marginBottom: 6 }}>
                                                {line}
                                            </T>
                                        ))}
                                </>
                            ) : (
                                <T size={fontSize.body} color="#6B7280">
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
