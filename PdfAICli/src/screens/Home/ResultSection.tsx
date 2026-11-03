/**
 * Home – Analiz Sonucu: Değerler / Dikkat; Tahlil Yorumu üstte modal.
 */
import React, {useMemo, useState} from 'react';
import {View, TouchableOpacity, StyleSheet, ScrollView} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import T from '../../components/Text/T';
import Chart from '../../components/Chart/Chart';
import AnalysisContent from '../../components/AnalysisContent/AnalysisContent';
import EmptyState from '../../components/EmptyState/EmptyState';
import CenterModal from '../../components/Modals/CenterModal';
import SegmentedTabs from '../../components/SegmentedTabs/SegmentedTabs';
import colors from '../../theme/colors';
import {fontSize} from '../../constants/typography';
import {iconSize} from '../../constants/icons';
import type {LabItem} from '../../server/api/Lab';
import {filterNotableLabItems} from '../../utils/labNotable';

export type ResultSectionProps = {
  items: LabItem[];
  analysis: string;
  onNoPdfWarning: () => void;
  trackButtonClick: (id: string, opts?: {screen?: string}) => void;
  t: (key: string) => string;
  styles: {
    resultCard: object;
    detailModalView?: object;
    pill?: object;
    pillWarning?: object;
    sectionGap?: object;
  };
  w1px: number;
  h1px: number;
};

type ResultTab = 'values' | 'notable';

function ResultSection({
  items,
  analysis,
  onNoPdfWarning,
  trackButtonClick,
  t,
  styles,
  w1px,
  h1px,
}: ResultSectionProps) {
  const [tab, setTab] = useState<ResultTab>('values');
  const [analysisVisible, setAnalysisVisible] = useState(false);
  const hasValues = Array.isArray(items) && items.length > 0;
  const hasAnalysis = !!(analysis && String(analysis).trim());
  const notableItems = useMemo(() => filterNotableLabItems(items), [items]);

  const local = useMemo(
    () =>
      StyleSheet.create({
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
          marginBottom: 10 * h1px,
        },
        emptyHint: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8 * w1px,
          backgroundColor: colors.backgroundPurpleSoft,
          paddingVertical: 8 * h1px,
          paddingHorizontal: 10 * w1px,
          borderRadius: 12 * w1px,
          borderWidth: 1,
          borderColor: colors.backgroundPurple + '30',
        },
      }),
    [w1px, h1px],
  );

  const resultTabs = useMemo(
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
    <View style={styles.resultCard}>
      <T
        size={fontSize.title}
        weight="700"
        color={colors.textDark}
        style={{marginBottom: 10 * h1px}}>
        {t('home.analysisResult')}
      </T>

      {!hasValues && !hasAnalysis ? (
        <TouchableOpacity
          onPress={() => {
            trackButtonClick('interpret_result', {screen: 'Home'});
            onNoPdfWarning();
          }}
          activeOpacity={0.7}
          style={local.emptyHint}>
          <Ionicons
            name="document-text-outline"
            size={iconSize.medium}
            color={colors.backgroundPurple}
          />
          <T
            size={fontSize.body}
            weight="600"
            color={colors.backgroundPurple}
            style={{flex: 1}}>
            {t('home.interpretButton')}
          </T>
          <Ionicons
            name="chevron-forward"
            size={iconSize.small}
            color={colors.backgroundPurple}
          />
        </TouchableOpacity>
      ) : (
        <>
          <TouchableOpacity
            style={local.analysisBtn}
            onPress={() => {
              trackButtonClick('interpret_result', {screen: 'Home'});
              setAnalysisVisible(true);
            }}
            activeOpacity={0.75}>
            <View style={local.analysisBtnIcon}>
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
            items={resultTabs}
            value={tab}
            onChange={setTab}
            style={local.tabsWrap}
          />

          {tab === 'values' ? (
            hasValues ? (
              <Chart items={items} />
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

          <CenterModal
            visible={analysisVisible}
            title={t('history.analysisComment')}
            fixedHeight
            rightButtonText={t('common.close')}
            onRightPress={() => setAnalysisVisible(false)}>
            {hasAnalysis ? (
              <ScrollView
                style={{width: '100%', flex: 1}}
                contentContainerStyle={{paddingBottom: 8 * h1px}}
                showsVerticalScrollIndicator={false}>
                <AnalysisContent content={analysis} />
              </ScrollView>
            ) : (
              <EmptyState title={t('home.noAnalysis')} />
            )}
          </CenterModal>
        </>
      )}
    </View>
  );
}

export default ResultSection;
