// src/screens/InfoSplash/index.tsx
import React from 'react';
import { View, StyleSheet, Image, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { useScreenTime } from '../../utils/analytics/useScreenTime';
import { useResponsive } from '../../utils/deviceStore/device';
import T from '../../components/Text/T';
import GradientLayout from '../../components/Layout/GradientLayout';
import { useT } from '../../store/useLocaleStore';
import colors from '../../theme/colors';
import { fontSize } from '../../constants/typography';

const InfoSplash: React.FC = () => {
    const navigation = useNavigation<any>();
    useScreenTime('InfoSplash');
    const t = useT();
    const { w1px, h1px, fs1px } = useResponsive();

    const goNext = () => {
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: 'SplashTwo' }],
            })
        );
    };
    const s = styles(w1px, h1px, fs1px);

    return (
        <GradientLayout>
            <View style={s.container}>
                <View style={s.centerWrap}>
                    <Image
                        source={require('../../assets/icons/test8.png')}
                        style={s.logo}
                        accessible
                        accessibilityLabel={t('splash.logoAlt')}
                    />
                </View>
                <View style={s.cta}>
                    <Pressable
                        onPress={goNext}
                        style={({ pressed }) => [s.button, pressed && { opacity: 0.85 }]}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                        <T size={fontSize.subtitle} weight="600" color="#fff">
                            {t('splash.continue')}
                        </T>
                    </Pressable>
                </View>
            </View>
        </GradientLayout>
    );
};

export default InfoSplash;

const styles = (w1px: number, h1px: number, fs1px: number) =>
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
            alignItems: 'center',
            justifyContent: 'center',
        },
        button: {
            backgroundColor: colors.backgroundPurple,
            borderRadius: 16 * w1px,
            paddingVertical: 14 * h1px,
            paddingHorizontal: 28 * w1px,
            minWidth: 220 * h1px,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#5B21B6',
            shadowOpacity: 0.16,
            shadowRadius: 10 * w1px,
            shadowOffset: { width: 0, height: 6 },
            elevation: 5,
            zIndex: 10,
        },
    });
