import React, { useCallback, useState } from 'react';
import {
    View,
    TouchableOpacity,
    Image,
    StyleSheet,
    Modal,
    Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useResponsive } from '../../utils/deviceStore/device';
import { useT } from '../../store/useLocaleStore';
import { useQuotaStore } from '../../store/useQuotaStore';
import { navigateToSettings } from '../../navigation/rootNavigation';
import T from '../Text/T';
import colors from '../../theme/colors';
import { fontSize } from '../../constants/typography';
import { iconSize } from '../../constants/icons';

type Props = {
    title?: string;
    onSettingsPress?: () => void;
};

const Header: React.FC<Props> = ({ title, onSettingsPress }) => {
    const t = useT();
    const { w1px, h1px, fs1px } = useResponsive();
    const remaining = useQuotaStore(s => s.remaining);
    const limitDisabled = useQuotaStore(s => s.limitDisabled);
    const loaded = useQuotaStore(s => s.loaded);
    const refreshQuota = useQuotaStore(s => s.refresh);
    const [infoVisible, setInfoVisible] = useState(false);

    useFocusEffect(
        useCallback(() => {
            void refreshQuota();
            setInfoVisible(false);
        }, [refreshQuota]),
    );

    const headerGradient: [string, string] = [
        colors.backgroundPurpleDark,
        '#8B6FEB',
    ];

    const showQuota = loaded && (limitDisabled || remaining !== null);
    const isEmpty = !limitDisabled && remaining !== null && remaining <= 0;

    const quotaLabel = limitDisabled
        ? t('header.quotaUnlimited')
        : isEmpty
          ? t('header.quotaEmpty')
          : t('header.quotaLeft').replace(
                '{{count}}',
                String(remaining ?? 0),
            );

    const infoMessage = limitDisabled
        ? t('header.quotaInfoUnlimited')
        : isEmpty
          ? t('header.quotaInfoEmpty')
          : t('header.quotaInfoLeft').replace(
                '{{count}}',
                String(remaining ?? 0),
            );

    const closeInfo = useCallback(() => setInfoVisible(false), []);

    const styles = StyleSheet.create({
        wrap: {
            zIndex: 20,
            elevation: 20,
        },
        header: {
            paddingLeft: 14 * w1px,
            paddingRight: 20 * w1px,
            paddingVertical: h1px * 14,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: h1px * 110,
            borderBottomRightRadius: fs1px * 14,
            borderBottomLeftRadius: fs1px * 14,
            overflow: 'hidden',
        },
        headerView: {
            marginTop: h1px * 18,
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
        },
        headerTitle: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 10 * w1px,
            flexShrink: 1,
        },
        title: { marginLeft: w1px * 3, flexShrink: 1 },
        settingsView: {
            alignSelf: 'center',
            width: iconSize.xl * w1px,
            height: iconSize.xl * h1px,
            resizeMode: 'contain',
        },
        rightRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10 * w1px,
        },
        quotaChip: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10 * w1px,
            paddingVertical: 6 * h1px,
            borderRadius: 20 * fs1px,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.45)',
        },
        dismissLayer: {
            flex: 1,
            backgroundColor: 'transparent',
        },
        infoDrop: {
            position: 'absolute',
            top: h1px * 88,
            right: 48 * w1px,
            maxWidth: 250 * w1px,
        },
        infoArrow: {
            position: 'absolute',
            top: 0,
            right: 22 * w1px,
            width: 0,
            height: 0,
            borderLeftWidth: 7 * w1px,
            borderRightWidth: 7 * w1px,
            borderBottomWidth: 8 * h1px,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: colors.white,
            zIndex: 2,
        },
        infoArrowBorder: {
            position: 'absolute',
            top: -1,
            right: 21 * w1px,
            width: 0,
            height: 0,
            borderLeftWidth: 8 * w1px,
            borderRightWidth: 8 * w1px,
            borderBottomWidth: 9 * h1px,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: colors.backgroundPurpleSoft,
            zIndex: 1,
        },
        infoBubble: {
            marginTop: 7 * h1px,
            backgroundColor: colors.white,
            borderRadius: 10 * fs1px,
            paddingVertical: 10 * h1px,
            paddingHorizontal: 12 * w1px,
            borderWidth: 1,
            borderColor: colors.backgroundPurpleSoft,
            shadowColor: colors.black,
            shadowOpacity: 0.1,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
            elevation: 6,
        },
    });

    return (
        <View style={styles.wrap}>
            <LinearGradient
                colors={headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.header}>
                <View style={styles.headerView}>
                    <View style={styles.headerTitle}>
                        <T
                            size={fontSize.titleLarge}
                            weight="700"
                            color={colors.textWhite}>
                            {t('header.welcome')},
                        </T>
                        {title ? (
                            <View style={styles.title}>
                                <T
                                    size={fontSize.titleLarge}
                                    weight="600"
                                    color={colors.textWhite}
                                    numberOfLines={1}>
                                    {title.charAt(0).toUpperCase() +
                                        title.slice(1)}
                                </T>
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.rightRow}>
                        {showQuota ? (
                            <TouchableOpacity
                                style={styles.quotaChip}
                                activeOpacity={0.85}
                                onPress={() => setInfoVisible(v => !v)}
                                accessibilityRole="button"
                                accessibilityLabel={quotaLabel}
                                accessibilityHint={infoMessage}>
                                <T
                                    size={fontSize.bodySmall}
                                    weight="700"
                                    color={colors.textWhite}
                                    numberOfLines={1}>
                                    {quotaLabel}
                                </T>
                            </TouchableOpacity>
                        ) : null}
                        <TouchableOpacity
                            onPress={
                                onSettingsPress ??
                                (() => {
                                    setInfoVisible(false);
                                    navigateToSettings();
                                })
                            }
                            activeOpacity={0.8}>
                            <Image
                                source={require('../../assets/icons/settings2.png')}
                                style={styles.settingsView}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            <Modal
                visible={infoVisible}
                transparent
                animationType="none"
                statusBarTranslucent
                onRequestClose={closeInfo}>
                <Pressable style={styles.dismissLayer} onPress={closeInfo}>
                    <Pressable
                        style={styles.infoDrop}
                        onPress={e => e.stopPropagation()}>
                        <View style={styles.infoArrowBorder} />
                        <View style={styles.infoArrow} />
                        <View style={styles.infoBubble}>
                            <T
                                size={fontSize.bodySmall}
                                weight="500"
                                color={colors.textGraySoft}>
                                {infoMessage}
                            </T>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

export default Header;
