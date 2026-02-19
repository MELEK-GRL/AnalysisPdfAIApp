import React, { useMemo } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLocaleStore } from '../../store/useLocaleStore';
import { useScreenTime } from '../../utils/analytics/useScreenTime';
import { useResponsive } from '../../utils/deviceStore/device';
import T from '../../components/Text/T';
import colors from '../../theme/colors';
import { fontSize } from '../../constants/typography';
import GradientLayout from '../../components/Layout/GradientLayout';
import { PRIVACY_POLICY_CONTENT } from '../../content/privacyPolicyContent';

const PrivacyPolicy: React.FC = () => {
    const nav = useNavigation<any>();
    useScreenTime('PrivacyPolicy');
    const { t, locale } = useLocaleStore();
    const { w1px, h1px, fs1px } = useResponsive();
    const content = locale === 'tr' ? PRIVACY_POLICY_CONTENT.tr : PRIVACY_POLICY_CONTENT.en;

    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: {
                    flex: 1,
                    padding: 20 * w1px,
                },
                headerRow: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 20 * h1px,
                },
                backBtn: {
                    padding: 8 * w1px,
                    marginRight: 8 * w1px,
                },
                title: {
                    flex: 1,
                },
                scroll: {
                    flex: 1,
                },
                section: {
                    marginBottom: 20 * h1px,
                },
                sectionTitle: {
                    marginBottom: 8 * h1px,
                    color: '#111827',
                },
                sectionSubtitle: {
                    marginBottom: 6 * h1px,
                    color: '#374151',
                },
                bullet: {
                    marginBottom: 4 * h1px,
                    paddingLeft: 12 * w1px,
                },
            }),
        [w1px, h1px, fs1px],
    );

    return (
        <GradientLayout>
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => nav.goBack()}
                        activeOpacity={0.8}>
                        <T size={fontSize.subtitle} weight="600" color="#6B7280">
                            ← {t('common.back')}
                        </T>
                    </TouchableOpacity>
                    <T size={20} weight="700" color="#111827" style={styles.title}>
                        {t('settings.privacyPolicy')}
                    </T>
                </View>

                <ScrollView
                    style={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}>
                    {content.sections.map((sec, idx) => (
                        <View key={idx} style={styles.section}>
                            <T size={fontSize.subtitle} weight="700" style={styles.sectionTitle}>
                                {sec.title}
                            </T>
                            {sec.paragraphs?.map((p, i) => (
                                <T key={i} size={fontSize.body} color="#4B5563" style={{ marginBottom: 6 }}>
                                    {p}
                                </T>
                            ))}
                            {sec.bullets?.map((b, i) => (
                                <T key={i} size={fontSize.body} color="#4B5563" style={styles.bullet}>
                                    • {b}
                                </T>
                            ))}
                        </View>
                    ))}
                </ScrollView>
            </View>
        </GradientLayout>
    );
};

export default PrivacyPolicy;
