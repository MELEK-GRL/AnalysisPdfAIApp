// src/screens/InfoSplash/index.tsx
import React from 'react';
import { View, StyleSheet, Image, Pressable, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useScreenTime } from '../../utils/analytics/useScreenTime';
import { useResponsive } from '../../utils/deviceStore/device';
import T from '../../components/Text/T';
import GradientLayout from '../../components/Layout/GradientLayout';
import { useT, useLocaleStore } from '../../store/useLocaleStore';
import colors from '../../theme/colors';
import { fontSize } from '../../constants/typography';
import { iconSize } from '../../constants/icons';

const InfoSplash: React.FC = () => {
    const navigation = useNavigation<any>();
    useScreenTime('InfoSplash');
    const t = useT();
    const locale = useLocaleStore((s) => s.locale);
    const { w1px, h1px, fs1px } = useResponsive();

    const goNext = () => {
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: 'SplashTwo' }],
            })
        );
    };
    const goBack = () => {
        navigation.replace('LanguageSplash');
    };
    const s = styles(w1px, h1px, fs1px);

    const steps = [
        { key: 'infoStep1' as const, icon: 'document-attach' as const },
        { key: 'infoStep2' as const, icon: 'sparkles' as const },
        { key: 'infoStep3' as const, icon: 'chatbubble-ellipses' as const },
    ];

    return (
        <GradientLayout>
            <View style={s.container}>
                <ScrollView
                    style={s.scroll}
                    contentContainerStyle={s.scrollContent}
                    showsVerticalScrollIndicator={false}>
                    <View style={s.centerWrap}>
                        <Image
                            source={locale === 'en' ? require('../../assets/icons/test10.png') : require('../../assets/icons/test8.png')}
                            style={s.logo}
                            accessible
                            accessibilityLabel={t('splash.logoAlt')}
                        />
                    </View>
                    <View style={s.card}>
                        <View style={s.cardAccent} />
                        <View style={s.cardInner}>
                            <T size={fontSize.title} weight="700" color={colors.textDark} style={s.cardTitle}>
                                {t('splash.infoTitle')}
                            </T>
                            <T size={fontSize.body} color="#5B5B6B" style={s.desc}>
                                {t('splash.infoSubtitle')}
                            </T>
                            <View style={s.stepsRow}>
                                {steps.map(({ key, icon }) => (
                                    <View key={key} style={s.stepItem}>
                                        <View style={s.stepIconWrap}>
                                            <Ionicons name={icon} size={iconSize.medium} color={colors.backgroundPurple} />
                                        </View>
                                        <T size={fontSize.caption} weight="600" color={colors.textDark} numberOfLines={1}>
                                            {t(`splash.${key}`)}
                                        </T>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                </ScrollView>
                <View style={s.cta}>
                    <TouchableOpacity
                        onPress={goBack}
                        style={s.backButton}
                        activeOpacity={0.8}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                        <Ionicons name="chevron-back" size={iconSize.large} color={colors.white} />
                        <T size={fontSize.body} color={colors.white} weight="600">
                            {t('common.back')}
                        </T>
                    </TouchableOpacity>
                    <Pressable
                        onPress={goNext}
                        style={({ pressed }) => [s.button, pressed && { opacity: 0.85 }]}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                        <T size={fontSize.subtitle} weight="600" color="#fff">
                            {t('splash.continue')}
                        </T>
                        <Ionicons name="chevron-forward" size={iconSize.medium} color="#fff" />
                    </Pressable>
                </View>
            </View>
        </GradientLayout>
    );
};

export default InfoSplash;

const styles = (w1px: number, h1px: number, _fs1px: number) =>
    StyleSheet.create({
        container: {
            flex: 1,
            paddingTop: 56 * h1px,
            paddingBottom: 40 * h1px,
            paddingHorizontal: 20 * w1px,
        },
        scroll: {
            flex: 1,
        },
        scrollContent: {
            paddingBottom: 24 * h1px,
        },
        centerWrap: {
            alignItems: 'center',
            marginBottom: 20 * h1px,
        },
        logo: {
            width: 180 * w1px,
            height: 180 * h1px,
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
            marginBottom: 12 * h1px,
            letterSpacing: 0.3,
        },
        desc: {
            lineHeight: 24,
            marginBottom: 20 * h1px,
            paddingLeft: 2,
        },
        stepsRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 8 * w1px,
        },
        stepItem: {
            flex: 1,
            alignItems: 'center',
        },
        stepIconWrap: {
            width: 44 * w1px,
            height: 44 * w1px,
            borderRadius: 14 * w1px,
            backgroundColor: colors.backgroundPurpleSoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8 * h1px,
        },
        cta: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 20 * h1px,
        },
        backButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6 * w1px,
            backgroundColor: colors.buttonGray,
            borderRadius: 16 * w1px,
            paddingVertical: 14 * h1px,
            paddingHorizontal: 20 * w1px,
        },
        button: {
            flexDirection: 'row',
            backgroundColor: colors.backgroundPurple,
            borderRadius: 16 * w1px,
            paddingVertical: 14 * h1px,
            paddingHorizontal: 28 * w1px,
            minWidth: 220 * h1px,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8 * w1px,
            shadowColor: '#5B21B6',
            shadowOpacity: 0.16,
            shadowRadius: 10 * w1px,
            shadowOffset: { width: 0, height: 6 },
            elevation: 5,
            zIndex: 10,
        },
    });
