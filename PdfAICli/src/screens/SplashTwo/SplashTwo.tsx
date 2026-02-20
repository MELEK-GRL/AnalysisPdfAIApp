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
import { useT } from '../../store/useLocaleStore';
import { useScreenTime } from '../../utils/analytics/useScreenTime';
import { fontSize } from '../../constants/typography';
import { iconSize } from '../../constants/icons';
import GradientLayout from '../../components/Layout/GradientLayout';

const SplashTwo: React.FC = () => {
    const navigation = useNavigation<any>();
    useScreenTime('SplashTwo');
    const { w1px, h1px, fs1px } = useResponsive();
    const t = useT();

    const handleContinue = async () => {
        await AsyncStorage.setItem(CONSENT_GIVEN_ONCE, '1');
        navigation.replace('Login');
    };

    const s = styles(w1px, h1px, fs1px);

    return (
        <GradientLayout>
            <View style={s.container}>
                <View style={s.topBlock}>
                    <View style={s.logoWrap}>
                        <Image
                            source={require('../../assets/icons/test8.png')}
                            style={s.logo}
                            accessible
                            accessibilityLabel={t('splash.logoAlt')}
                        />
                    </View>

                    <View style={s.card}>
                        <View style={s.cardHeader}>
                            <View style={s.iconBadge}>
                                <Ionicons
                                    name="document-text"
                                    size={iconSize.large}
                                    color={colors.backgroundPurple}
                                />
                            </View>
                            <T
                                size={fontSize.title}
                                weight="700"
                                color="#374151"
                                style={s.cardTitle}>
                                {t('splash.splashTwoTitle')}
                            </T>
                        </View>

                        <T size={fontSize.body} color="#6B7280" style={s.desc}>
                            {t('splash.splashTwoDesc')}
                        </T>

                        <View style={s.disclaimerBox}>
                            <Ionicons
                                name="heart-outline"
                                size={iconSize.medium}
                                color="#B45309"
                                style={s.disclaimerIcon}
                            />
                            <T
                                size={fontSize.bodySmall}
                                color="#92400E"
                                style={s.disclaimerText}>
                                {t('splash.splashTwoDisclaimer')}
                            </T>
                        </View>
                    </View>
                </View>

                <View style={s.buttonWrap}>
                    <TouchableOpacity
                        onPress={handleContinue}
                        activeOpacity={0.8}
                        style={s.continueButton}>
                        <T size={fontSize.subtitle} weight="600" color="#fff">
                            {t('splash.continue')}
                        </T>
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
            paddingTop: 24 * h1px,
            paddingBottom: 40 * h1px,
            paddingHorizontal: 20 * w1px,
        },
        topBlock: {
            flex: 1,
        },
        logoWrap: {
            alignItems: 'center',
            marginBottom: 16 * h1px,
        },
        logo: {
            width: 200 * w1px,
            height: 200 * h1px,
            resizeMode: 'contain',
        },
        card: {
            backgroundColor: '#fff',
            borderRadius: 20 * w1px,
            padding: 20 * w1px,
            borderWidth: 1,
            borderColor: 'rgba(139, 92, 246, 0.12)',
            shadowColor: colors.backgroundPurple,
            shadowOpacity: 0.06,
            shadowRadius: 16 * w1px,
            shadowOffset: { width: 0, height: 4 },
            elevation: 3,
            marginBottom: 24 * h1px,
        },
        cardHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12 * h1px,
        },
        iconBadge: {
            width: 44 * w1px,
            height: 44 * w1px,
            borderRadius: 12 * w1px,
            backgroundColor: colors.backgroundPurpleSoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12 * w1px,
        },
        cardTitle: {
            flex: 1,
        },
        desc: {
            lineHeight: 22,
            marginBottom: 16 * h1px,
        },
        disclaimerBox: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            backgroundColor: '#FFFBEB',
            borderRadius: 12 * w1px,
            padding: 12 * w1px,
            borderWidth: 1,
            borderColor: '#FDE68A',
        },
        disclaimerIcon: {
            marginRight: 10 * w1px,
            marginTop: 2,
        },
        disclaimerText: {
            flex: 1,
            lineHeight: 20,
        },
        buttonWrap: {
            alignItems: 'center',
            paddingTop: 16 * h1px,
        },
        continueButton: {
            backgroundColor: colors.backgroundPurple,
            borderRadius: 16 * w1px,
            paddingVertical: 14 * h1px,
            paddingHorizontal: 28 * w1px,
            width: 220 * h1px,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#5B21B6',
            shadowOpacity: 0.16,
            shadowRadius: 10 * w1px,
            shadowOffset: { width: 0, height: 6 },
            elevation: 5,
        },
    });
