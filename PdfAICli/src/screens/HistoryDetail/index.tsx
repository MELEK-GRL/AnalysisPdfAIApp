/**
 * Geçmiş analiz detay sayfası (stack; tab menüsünde yok).
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  getLabHistoryItem,
  type LabHistoryDetail,
} from '../../server/api/Lab';
import type {HistoryStackParamList} from '../../navigation/historyNavigation';
import {useResponsive} from '../../utils/deviceStore/device';
import {useT, useLocaleStore} from '../../store/useLocaleStore';
import {useSessionStore} from '../../store/useSessionStore';
import {useScreenTime} from '../../utils/analytics/useScreenTime';
import Header from '../../components/Header/Header';
import PageHeader from '../../components/PageHeader/PageHeader';
import PageLayout from '../../components/Layout/PageLayout';
import T from '../../components/Text/T';
import Chart from '../../components/Chart/Chart';
import AnalysisContent from '../../components/AnalysisContent/AnalysisContent';
import EmptyState from '../../components/EmptyState/EmptyState';
import LoadingIndicator from '../../components/LoadingIndicator/LoadingIndicator';
import CenterModal from '../../components/Modals/CenterModal';
import PopupModal from '../../components/Modals/PopupModal';
import SegmentedTabs from '../../components/SegmentedTabs/SegmentedTabs';
import colors from '../../theme/colors';
import {fontSize} from '../../constants/typography';
import {iconSize} from '../../constants/icons';
import {filterNotableLabItems} from '../../utils/labNotable';

type DetailRoute = RouteProp<HistoryStackParamList, 'HistoryDetail'>;
type Nav = NativeStackNavigationProp<HistoryStackParamList>;
type DetailTab = 'values' | 'notable';

const HistoryDetail: React.FC = () => {
  useScreenTime('HistoryDetail');
  const navigation = useNavigation<Nav>();
  const route = useRoute<DetailRoute>();
  const {id} = route.params;
  const t = useT();
  const locale = useLocaleStore(s => s.locale);
  const {w1px, h1px} = useResponsive();

  const [detail, setDetail] = useState<LabHistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<DetailTab>('values');
  const [analysisVisible, setAnalysisVisible] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const notableItems = useMemo(
    () => filterNotableLabItems(detail?.items),
    [detail?.items],
  );

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLabHistoryItem(id);
      setDetail(data);
    } catch {
      setErrorMessage(t('history.detailError'));
      setErrorVisible(true);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    useSessionStore.getState().touch();
    loadDetail();
  }, [loadDetail]);

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
        root: {flex: 1, backgroundColor: colors.white},
        loadingWrap: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 280 * h1px,
        },
        metaBand: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8 * w1px,
          marginBottom: 8 * h1px,
          paddingVertical: 8 * h1px,
          paddingHorizontal: 10 * w1px,
          backgroundColor: colors.backgroundPurpleSoft,
          borderRadius: 12 * w1px,
          borderWidth: 1,
          borderColor: 'rgba(116, 83, 224, 0.14)',
        },
        metaIconWrap: {
          width: 36 * w1px,
          height: 36 * w1px,
          borderRadius: 10 * w1px,
          backgroundColor: colors.white,
          alignItems: 'center',
          justifyContent: 'center',
        },
        metaTextCol: {
          flex: 1,
          minWidth: 0,
          gap: 6 * h1px,
        },
        dateChip: {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: 4 * w1px,
          backgroundColor: colors.white,
          borderRadius: 999,
          paddingVertical: 2 * h1px,
          paddingHorizontal: 7 * w1px,
        },
        analysisBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8 * w1px,
          marginBottom: 8 * h1px,
          paddingVertical: 10 * h1px,
          paddingHorizontal: 12 * w1px,
          backgroundColor: colors.white,
          borderRadius: 12 * w1px,
          borderWidth: 1,
          borderColor: 'rgba(116, 83, 224, 0.22)',
        },
        analysisBtnIcon: {
          width: 32 * w1px,
          height: 32 * w1px,
          borderRadius: 9 * w1px,
          backgroundColor: colors.backgroundPurpleSoft,
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabsWrap: {
          marginBottom: 12 * h1px,
        },
      }),
    [w1px, h1px],
  );

  const detailTabs = useMemo(
    () => [
      {
        key: 'values' as const,
        label: t('history.labValues'),
        icon: 'flask-outline',
      },
      {
        key: 'notable' as const,
        label: t('history.notableFindings'),
        icon: 'alert-circle-outline',
        badge: notableItems.length,
        tone: 'alert' as const,
      },
    ],
    [t, notableItems.length],
  );

  return (
    <View style={styles.root}>
      <Header />
      <PageLayout>
        <PageHeader title={t('history.detailTitle')} />

        {loading || !detail ? (
          <View style={styles.loadingWrap}>
            {loading ? (
              <LoadingIndicator size="sm" />
            ) : (
              <T size={fontSize.body} color="#6B7280">
                {t('history.noRecord')}
              </T>
            )}
          </View>
        ) : (
          <>
            <ScrollView
              style={{flex: 1}}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{paddingBottom: 8 * h1px}}>
              <View style={styles.metaBand}>
                <View style={styles.metaIconWrap}>
                  <Ionicons
                    name="document-text"
                    size={iconSize.medium}
                    color={colors.backgroundPurple}
                  />
                </View>
                <View style={styles.metaTextCol}>
                  <T
                    size={fontSize.body}
                    weight="500"
                    color={colors.textDark}
                    numberOfLines={1}>
                    {detail.pdfName?.trim() ||
                      detail.patientName?.trim() ||
                      t('history.labReport')}
                  </T>
                  <View style={styles.dateChip}>
                    <Ionicons
                      name="calendar-outline"
                      size={iconSize.small}
                      color={colors.backgroundPurple}
                    />
                    <T
                      size={fontSize.captionLarge}
                      weight="600"
                      color={colors.backgroundPurpleDark}>
                      {formatDate(detail.createdAt)}
                    </T>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.analysisBtn}
                onPress={() => setAnalysisVisible(true)}
                activeOpacity={0.75}>
                <View style={styles.analysisBtnIcon}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={iconSize.medium}
                    color={colors.backgroundPurple}
                  />
                </View>
                <T
                  size={fontSize.body}
                  weight="600"
                  color={colors.backgroundPurpleDark}
                  style={{flex: 1}}>
                  {t('history.analysisComment')}
                </T>
                <Ionicons
                  name="chevron-forward"
                  size={iconSize.small}
                  color={colors.backgroundPurple}
                />
              </TouchableOpacity>

              <SegmentedTabs
                items={detailTabs}
                value={tab}
                onChange={setTab}
                style={styles.tabsWrap}
              />

              {tab === 'values' ? (
                detail.items?.length > 0 ? (
                  <Chart items={detail.items} />
                ) : (
                  <T size={fontSize.body} color="#6B7280">
                    {t('history.noRecord')}
                  </T>
                )
              ) : notableItems.length > 0 ? (
                <Chart items={notableItems} />
              ) : (
                <EmptyState title={t('history.notableEmpty')} />
              )}
            </ScrollView>
          </>
        )}
      </PageLayout>

      <CenterModal
        visible={analysisVisible}
        title={t('history.analysisComment')}
        fixedHeight
        rightButtonText={t('common.close')}
        onRightPress={() => setAnalysisVisible(false)}>
        {detail?.analysis?.trim() ? (
          <ScrollView
            style={{width: '100%', flex: 1}}
            contentContainerStyle={{paddingBottom: 8 * h1px}}
            showsVerticalScrollIndicator={false}>
            <AnalysisContent content={detail.analysis} />
          </ScrollView>
        ) : (
          <EmptyState title={t('history.noRecord')} />
        )}
      </CenterModal>

      <PopupModal
        visible={errorVisible}
        title={t('common.error')}
        message={errorMessage}
        type="error"
        rightButtonText={t('common.ok')}
        onRightPress={() => {
          setErrorVisible(false);
          if (!detail) {
            navigation.goBack();
          }
        }}
      />
    </View>
  );
};

export default HistoryDetail;
