// src/screens/InfoSplash/index.tsx
import React from 'react';
import { View, StyleSheet, Image, Pressable, TouchableOpacity } from 'react-native';
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

    return (
        <GradientLayout>
            <View style={s.container}>
                <View style={s.centerWrap}>
                    <Image
                        source={locale === 'en' ? require('../../assets/icons/test10.png') : require('../../assets/icons/test8.png')}
                        style={s.logo}
                        accessible
                        accessibilityLabel={t('splash.logoAlt')}
                    />
                </View>
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
            justifyContent: 'space-between',
            paddingTop: 80 * h1px,
            paddingBottom: 40 * h1px,
            paddingHorizontal: 20 * w1px,
        },
        centerWrap: {
            alignItems: 'center',
            justifyContent: 'center',
        },
        logo: {
            width: 220 * w1px,
            height: 220 * h1px,
            resizeMode: 'contain',
        },
        cta: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
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
