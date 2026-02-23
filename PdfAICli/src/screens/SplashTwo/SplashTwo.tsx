import React from 'react';
import {
    View,
    StyleSheet,
    Image,
    TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { CONSENT_GIVEN_ONCE } from '../../constants/storageKeys';
import { useResponsive } from '../../utils/deviceStore/device';
import T from '../../components/Text/T';
import colors from '../../theme/colors';
import { useT, useLocaleStore } from '../../store/useLocaleStore';
import { useScreenTime } from '../../utils/analytics/useScreenTime';
import { fontSize } from '../../constants/typography';
import { iconSize } from '../../constants/icons';
import {
    SPLASH_LOGO_SIZE,
    SPLASH_CONTAINER_PADDING_TOP,
    SPLASH_LOGO_MARGIN_BOTTOM,
    SPLASH_CONTAINER_PADDING_HORIZONTAL,
} from '../../constants/splashLayout';
import GradientLayout from '../../components/Layout/GradientLayout';

const SplashTwo: React.FC = () => {
    const navigation = useNavigation<any>();
    useScreenTime('SplashTwo');
    const { w1px, h1px, fs1px } = useResponsive();
    const t = useT();
    const locale = useLocaleStore((s) => s.locale);

    const handleContinue = async () => {
        await AsyncStorage.setItem(CONSENT_GIVEN_ONCE, '1');
        navigation.replace('Login');
    };
    const goBack = () => {
        navigation.replace('InfoSplash');
    };

    const s = styles(w1px, h1px, fs1px);

    return (
        <GradientLayout>
            <View style={s.container}>
                <View style={s.topBlock}>
                    <View style={s.logoWrap}>
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
                            <View style={s.cardHeader}>
                                <View style={s.iconBadge}>
                                    <Ionicons
                                        name="document-text"
                                        size={iconSize.xl}
                                        color={colors.backgroundPurple}
                                    />
                                </View>
                                <T
                                    size={fontSize.title}
                                    weight="700"
                                    color={colors.textDark}
                                    style={s.cardTitle}>
                                    {t('splash.splashTwoTitle')}
                                </T>
                            </View>

                            <T size={fontSize.body} color="#5B5B6B" style={s.desc}>
                                {t('splash.splashTwoDesc')}
                            </T>

                            <View style={s.disclaimerBox}>
                                <View style={s.disclaimerIconWrap}>
                                    <Ionicons
                                        name="heart"
                                        size={iconSize.medium}
                                        color={colors.backgroundPurple}
                                    />
                                </View>
                                <T
                                    size={fontSize.bodySmall}
                                    color="#4C1D95"
                                    weight="500"
                                    style={s.disclaimerText}>
                                    {t('splash.splashTwoDisclaimer')}
                                </T>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={s.buttonWrap}>
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
                    <TouchableOpacity
                        onPress={handleContinue}
                        activeOpacity={0.8}
                        style={s.continueButton}>
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

export default SplashTwo;

const styles = (w1px: number, h1px: number, _fs1px: number) =>
    StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'space-between',
            paddingTop: SPLASH_CONTAINER_PADDING_TOP * h1px,
            paddingBottom: 56 * h1px,
            paddingHorizontal: SPLASH_CONTAINER_PADDING_HORIZONTAL * w1px,
        },
        topBlock: {
            flex: 1,
        },
        logoWrap: {
            alignItems: 'center',
            marginBottom: SPLASH_LOGO_MARGIN_BOTTOM * h1px,
        },
        logo: {
            width: SPLASH_LOGO_SIZE * w1px,
            height: SPLASH_LOGO_SIZE * h1px,
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
        cardHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16 * h1px,
        },
        iconBadge: {
            width: 52 * w1px,
            height: 52 * w1px,
            borderRadius: 16 * w1px,
            backgroundColor: colors.backgroundPurpleSoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 14 * w1px,
        },
        cardTitle: {
            flex: 1,
            letterSpacing: 0.3,
        },
        desc: {
            lineHeight: 24,
            marginBottom: 20 * h1px,
            paddingLeft: 2,
        },
        disclaimerBox: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            backgroundColor: '#F5F3FF',
            borderRadius: 16 * w1px,
            padding: 16 * w1px,
            borderWidth: 1,
            borderColor: '#E9D5FF',
        },
        disclaimerIconWrap: {
            width: 36 * w1px,
            height: 36 * w1px,
            borderRadius: 18 * w1px,
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12 * w1px,
        },
        disclaimerText: {
            flex: 1,
            lineHeight: 22,
        },
        buttonWrap: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12 * w1px,
            paddingTop: 16 * h1px,
            paddingBottom: 8 * h1px,
        },
        backButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6 * w1px,
            backgroundColor: colors.buttonGray,
            borderRadius: 12 * w1px,
            paddingVertical: 10 * h1px,
            paddingHorizontal: 16 * w1px,
        },
        continueButton: {
            flex: 1,
            flexDirection: 'row',
            backgroundColor: colors.backgroundPurple,
            borderRadius: 12 * w1px,
            paddingVertical: 10 * h1px,
            paddingHorizontal: 16 * w1px,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6 * w1px,
            shadowColor: '#5B21B6',
            shadowOpacity: 0.16,
            shadowRadius: 8 * w1px,
            shadowOffset: { width: 0, height: 4 },
            elevation: 5,
        },
    });
