// src/screens/InfoSplash/index.tsx
import React, { useRef } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import Button from '../../components/Buttons/Button';
import { useResponsive } from '../../utils/deviceStore/device';
import T from '../../components/Text/T';
import GradientLayout from '../../components/Layout/GradientLayout';

const InfoSplash: React.FC = () => {
    const navigation = useNavigation<any>();
    const animRef = useRef<LottieView>(null);
    const { w1px, h1px, fs1px } = useResponsive();

    const goNext = () => navigation.navigate('SplashTwo');
    const s = styles(w1px, h1px, fs1px);

    return (
        <GradientLayout>
            <View style={s.container}>
                {/* Orta kısım */}
                <View style={s.centerWrap}>
                    <Image
                        source={require('../../assets/icons/test8.png')}
                        style={s.logo}
                        accessible
                        accessibilityLabel="Tahlil Analizi Logo"
                    />
                </View>

                {/* CTA */}
                <View style={s.cta}>
                    <Button
                        buttonText="Devam Et"
                        onPress={goNext}
                        width={h1px * 220}
                        style={{
                            shadowColor: '#5B21B6',
                            shadowOpacity: 0.16,
                            shadowRadius: 10 * w1px,
                            shadowOffset: { width: 0, height: 6 },
                            elevation: 3,
                        }}
                        accessibilityLabel="Devam Et"
                        accessibilityHint="Kullanıcı sözleşmesi ekranına geç"
                    />

                    <T
                        size={12 * fs1px}
                        color="#9CA3AF"
                        align="center"
                        style={{ marginTop: 10 * h1px }}>
                        Devam ederek kullanım şartlarını kabul edeceksiniz
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
