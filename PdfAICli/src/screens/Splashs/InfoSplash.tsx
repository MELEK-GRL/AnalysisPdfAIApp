// src/screens/InfoSplash/index.tsx
import React, { useRef } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import { useScreenTime } from '../../utils/analytics/useScreenTime';
import Button from '../../components/Buttons/Button';
import { useResponsive } from '../../utils/deviceStore/device';
import T from '../../components/Text/T';
import GradientLayout from '../../components/Layout/GradientLayout';
import { useT } from '../../store/useLocaleStore';

const InfoSplash: React.FC = () => {
    const navigation = useNavigation<any>();
    useScreenTime('InfoSplash');
    const t = useT();
    const animRef = useRef<LottieView>(null);
    const { w1px, h1px, fs1px } = useResponsive();

    const goNext = () => navigation.navigate('SplashTwo');
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
                    <Button
                        buttonText={t('splash.continue')}
                        onPress={goNext}
                        width={h1px * 220}
                        style={{
                            shadowColor: '#5B21B6',
                            shadowOpacity: 0.16,
                            shadowRadius: 10 * w1px,
                            shadowOffset: { width: 0, height: 6 },
                            elevation: 3,
                        }}
                        accessibilityLabel={t('splash.continue')}
                        accessibilityHint={t('splash.consentHint')}
                    />

                    <T
                        size={12 * fs1px}
                        color="#9CA3AF"
                        align="center"
                        style={{ marginTop: 10 * h1px }}>
                        {t('splash.consentHint')}
                    </T>
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
    });
