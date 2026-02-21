import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useResponsive } from '../../utils/deviceStore/device';
import { useScreenTime } from '../../utils/analytics/useScreenTime';
import { useLocaleStore, useT } from '../../store/useLocaleStore';
import { LANGUAGE_SPLASH_SEEN } from '../../constants/storageKeys';
import T from '../../components/Text/T';
import GradientLayout from '../../components/Layout/GradientLayout';
import colors from '../../theme/colors';
import { fontSize } from '../../constants/typography';
import { iconSize } from '../../constants/icons';

type LocaleCode = 'tr' | 'en';

const LanguageSplash: React.FC = () => {
    const navigation = useNavigation<any>();
    useScreenTime('LanguageSplash');
    const t = useT();
    const setLocale = useLocaleStore((s) => s.setLocale);
    const [selected, setSelected] = useState<LocaleCode | null>('tr');
    const { w1px, h1px, fs1px } = useResponsive();

    const s = useMemo(
        () =>
            StyleSheet.create({
                container: {
                    flex: 1,
                    justifyContent: 'space-between',
                    paddingTop: 24 * h1px,
                    paddingBottom: 56 * h1px,
                    paddingHorizontal: 20 * w1px,
                },
                topBlock: {
                    flex: 1,
                },
                logoWrap: {
                    alignItems: 'center',
                    marginBottom: 20 * h1px,
                },
                logo: {
                    width: 200 * w1px,
                    height: 200 * h1px,
                    resizeMode: 'contain',
                },
                card: {
                    backgroundColor: '#fff',
                    borderRadius: 24 * w1px,
                    overflow: 'hidden',
                    shadowColor: '#5B21B6',
                    shadowOpacity: 0.08,
                    shadowRadius: 24 * w1px,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 6,
                    marginBottom: 24 * h1px,
                    position: 'relative',
                },
                cardAccent: {
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    backgroundColor: colors.backgroundPurple,
                    borderTopLeftRadius: 4,
                    borderBottomLeftRadius: 4,
                },
                cardInner: {
                    padding: 24 * w1px,
                    paddingLeft: 28 * w1px,
                },
                cardTitle: {
                    marginBottom: 8 * h1px,
                },
                cardSubtitle: {
                    color: '#5B5B6B',
                    marginBottom: 20 * h1px,
                    lineHeight: 22,
                },
                langRow: {
                    flexDirection: 'row',
                    gap: 12 * w1px,
                },
                langOption: {
                    flex: 1,
                    borderRadius: 16 * w1px,
                    paddingVertical: 16 * h1px,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                },
                langOptionInactive: {
                    borderColor: '#E5E7EB',
                    backgroundColor: '#F9FAFB',
                },
                langOptionActive: {
                    borderColor: colors.backgroundPurple,
                    backgroundColor: colors.backgroundPurpleSoft,
                },
                hint: {
                    marginTop: 16 * h1px,
                    paddingTop: 16 * h1px,
                    borderTopWidth: 1,
                    borderTopColor: '#F3F4F6',
                },
                buttonRow: {
                    alignItems: 'center',
                    paddingTop: 24 * h1px,
                    paddingBottom: 8 * h1px,
                },
                continueButton: {
                    flexDirection: 'row',
                    minWidth: 220 * w1px,
                    backgroundColor: colors.backgroundPurple,
                    borderRadius: 16 * w1px,
                    paddingVertical: 14 * h1px,
                    paddingHorizontal: 28 * w1px,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8 * w1px,
                    shadowColor: '#5B21B6',
                    shadowOpacity: 0.16,
                    shadowRadius: 10 * w1px,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 5,
                },
            }),
        [w1px, h1px, fs1px],
    );

    const handleContinue = async () => {
        const lang = selected ?? 'tr';
        await setLocale(lang);
        await AsyncStorage.setItem(LANGUAGE_SPLASH_SEEN, '1');
        navigation.replace('InfoSplash');
    };

    return (
        <GradientLayout>
            <View style={s.container}>
                <View style={s.topBlock}>
                    <View style={s.logoWrap}>
                        <Image
                            source={(selected ?? 'tr') === 'en' ? require('../../assets/icons/test10.png') : require('../../assets/icons/test8.png')}
                            style={s.logo}
                            resizeMode="contain"
                            accessibilityLabel="Tahlil Analizi Logo"
                        />
                    </View>

                    <View style={s.card}>
                        <View style={s.cardAccent} />
                        <View style={s.cardInner}>
                            <T
                                size={fontSize.title}
                                weight="700"
                                color={colors.textDark}
                                style={s.cardTitle}>
                                Dilini seç / Choose your language
                            </T>
                            <T size={fontSize.body} style={s.cardSubtitle}>
                                Uygulama dilinizi seçin. İstediğin zaman Ayarlar'dan değiştirebilirsin.{'\n'}
                                Select your app language. You can change it later in Settings.
                            </T>

                            <View style={s.langRow}>
                                <TouchableOpacity
                                    style={[
                                        s.langOption,
                                        selected === 'tr' ? s.langOptionActive : s.langOptionInactive,
                                    ]}
                                    onPress={() => setSelected('tr')}
                                    activeOpacity={0.8}>
                                    <T
                                        size={fontSize.subtitle}
                                        weight="700"
                                        color={selected === 'tr' ? colors.backgroundPurple : colors.textDark}>
                                        Türkçe
                                    </T>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        s.langOption,
                                        selected === 'en' ? s.langOptionActive : s.langOptionInactive,
                                    ]}
                                    onPress={() => setSelected('en')}
                                    activeOpacity={0.8}>
                                    <T
                                        size={fontSize.subtitle}
                                        weight="700"
                                        color={selected === 'en' ? colors.backgroundPurple : colors.textDark}>
                                        English
                                    </T>
                                </TouchableOpacity>
                            </View>

                            <View style={s.hint}>
                                <T size={fontSize.bodySmall} color="#9CA3AF">
                                    Dilini sonradan Ayarlar'dan değiştirebilirsin.
                                </T>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={s.buttonRow}>
                    <TouchableOpacity
                        style={s.continueButton}
                        onPress={handleContinue}
                        activeOpacity={0.85}>
                        <T size={fontSize.subtitle} weight="600" color="#fff">
                            {t('splash.continue')}
                        </T>
                        <Ionicons name="chevron-forward" size={iconSize.medium} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </GradientLayout>
    );
};

export default LanguageSplash;
