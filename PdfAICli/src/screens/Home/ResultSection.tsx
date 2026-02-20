/**
 * Home ekranı – Analiz sonucu başlığı, yorumla butonu ve grafik (Chart).
 */
import React from 'react';
import { View, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import T from '../../components/Text/T';
import Chart from '../../components/Chart/Chart';
import AnalysisContent from '../../components/AnalysisContent/AnalysisContent';
import colors from '../../theme/colors';
import { fontSize } from '../../constants/typography';
import { iconSize } from '../../constants/icons';
import type { LabItem } from '../../server/api/Lab';
import { useAnalysisModalStore } from '../../store/useAnalysisModalStore';

export type ResultSectionProps = {
    items: LabItem[];
    analysis: string;
    pickedFile: { name?: string } | null;
    onNoPdfWarning: () => void;
    trackButtonClick: (id: string, opts?: { screen?: string }) => void;
    t: (key: string) => string;
    styles: {
        resultCard: object;
        detailModalView: object;
        pill: object;
        sectionGap: object;
    };
    w1px: number;
    h1px: number;
};

const ResultSection: React.FC<ResultSectionProps> = ({
    items,
    analysis,
    pickedFile,
    onNoPdfWarning,
    trackButtonClick,
    t,
    styles,
    w1px,
    h1px,
}) => {
    const openModal = useAnalysisModalStore((s) => s.open);

    const handleInterpret = () => {
        trackButtonClick('interpret_result', { screen: 'Home' });
        if (items.length === 0 && !analysis) {
            onNoPdfWarning();
            return;
        }
        openModal({
            title: t('home.analysisTitle'),
            content: (
                <ScrollView
                    style={styles.detailModalView}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}>
                    <Pressable>
                        <View>
                            <View style={styles.pill}>
                                <T size={fontSize.label} weight="700" color="#111827">
                                    {t('tabs.analysis').toUpperCase()}
                                </T>
                            </View>
                            {analysis ? (
                                <AnalysisContent content={analysis} />
                            ) : (
                                <T size={fontSize.body} color="#111827">
                                    {t('home.noAnalysis')}
                                </T>
                            )}
                            <View style={styles.sectionGap} />
                            <View style={styles.pill}>
                                <T size={fontSize.label} weight="700" color="#111827">
                                    {t('home.suggestions')}
                                </T>
                            </View>
                            <T size={fontSize.body} color="#111827">
                                {t('home.suggestionsText')}
                            </T>
                            <View style={styles.sectionGap} />
                            <View style={[styles.pill, { backgroundColor: '#FEF2F2' }]}>
                                <T size={fontSize.label} weight="700" color="#991B1B">
                                    {t('home.importantWarning')}
                                </T>
                            </View>
                            <T size={fontSize.body} color="#991B1B">
                                {t('home.disclaimer')}
                            </T>
                        </View>
                    </Pressable>
                </ScrollView>
            ),
            onClose: () => {},
        });
    };

    return (
        <View style={styles.resultCard}>
            <T size={fontSize.title} weight="700" color={colors.backgroundPurpleDark} style={{ marginBottom: 8 * h1px }}>
                {t('home.analysisResult')}
            </T>

            <TouchableOpacity
                onPress={handleInterpret}
                activeOpacity={0.7}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignSelf: 'flex-start',
                    gap: 8 * w1px,
                    marginBottom: 12 * h1px,
                    backgroundColor: colors.backgroundPurpleSoft,
                    paddingVertical: 10 * h1px,
                    paddingHorizontal: 14 * w1px,
                    borderRadius: 12 * w1px,
                    borderWidth: 1,
                    borderColor: colors.backgroundPurple + '30',
                }}>
                <Ionicons name="document-text-outline" size={iconSize.medium} color={colors.backgroundPurple} />
                <T size={fontSize.body} weight="600" color={colors.backgroundPurple}>
                    {t('home.interpretButton')}
                </T>
                <Ionicons name="chevron-forward" size={iconSize.small} color={colors.backgroundPurple} />
            </TouchableOpacity>

            {items.length > 0 && !pickedFile && (
                <View>
                    <Chart items={items} />
                </View>
            )}
        </View>
    );
};

export default ResultSection;
