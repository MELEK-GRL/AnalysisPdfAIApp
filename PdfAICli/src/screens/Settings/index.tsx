import React, { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, CommonActions, useFocusEffect } from '@react-navigation/native';
import { useLocaleStore } from '../../store/useLocaleStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useSessionStore } from '../../store/useSessionStore';
import { useScreenTime } from '../../utils/analytics/useScreenTime';
import { useResponsive } from '../../utils/deviceStore/device';
import T from '../../components/Text/T';
import { fontSize } from '../../constants/typography';
import { iconSize } from '../../constants/icons';
import PopupModal from '../../components/Modals/PopupModal';
import colors from '../../theme/colors';
import GradientLayout from '../../components/Layout/GradientLayout';

type SettingsProps = { showBackButton?: boolean };

const Settings: React.FC<SettingsProps> = ({ showBackButton = true }) => {
    const nav = useNavigation<any>();
    useScreenTime('Settings');
    useFocusEffect(
        useCallback(() => {
            useSessionStore.getState().touch();
        }, []),
    );
    const { locale, setLocale, t } = useLocaleStore();
    const user = useAuthStore(s => s.user);
    const logout = useAuthStore(s => s.logout);
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
    const { w1px, h1px, fs1px } = useResponsive();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: {
                    flex: 1,
                    padding: 20 * w1px,
                    paddingTop: 52 * h1px,
                },
                headerRow: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 24 * h1px,
                },
                backBtnWrap: {
                    width: 38 * w1px,
                    height: 38 * w1px,
                    borderRadius: 19 * w1px,
                    backgroundColor: colors.backgroundPurpleSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12 * w1px,
                    borderWidth: 1,
                    borderColor: 'rgba(116, 83, 224, 0.2)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.06,
                    shadowRadius: 3,
                    elevation: 2,
                },
                headerCenter: {
                    flex: 1,
                },
                pageTitle: {
                    marginBottom: 20 * h1px,
                },
                section: {
                    marginBottom: 24 * h1px,
                },
                sectionTitle: {
                    marginBottom: 12 * h1px,
                    color: '#1F2937',
                },
                row: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#fff',
                    borderRadius: 12 * w1px,
                    paddingVertical: 16 * h1px,
                    paddingHorizontal: 16 * w1px,
                    marginBottom: 10 * h1px,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                },
                langOption: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12 * w1px,
                },
                radio: {
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: colors.backgroundPurple,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                radioInner: {
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: colors.backgroundPurple,
                },
                deleteRow: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#fff',
                    borderRadius: 12 * w1px,
                    paddingVertical: 16 * h1px,
                    paddingHorizontal: 16 * w1px,
                    marginBottom: 10 * w1px,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    gap: 12 * w1px,
                },
                deleteIconWrap: {
                    width: 34 * w1px,
                    height: 34 * w1px,
                    borderRadius: 17 * w1px,
                    backgroundColor: '#F5F5F5',
                    alignItems: 'center',
                    justifyContent: 'center',
                },
            }),
        [w1px, h1px, fs1px],
    );

    const handleLogoutConfirm = useCallback(async () => {
        setLogoutModalVisible(false);
        try {
            await logout();
            nav.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
        } catch (_) {
            setLogoutModalVisible(true);
        }
    }, [logout, nav]);

    return (
        <GradientLayout>
            <View style={styles.container}>
                {showBackButton ? (
                    <View style={styles.headerRow}>
                        <TouchableOpacity
                            style={styles.backBtnWrap}
                            onPress={() => nav.goBack()}
                            activeOpacity={0.8}>
                            <Ionicons name="arrow-back" size={iconSize.medium} color={colors.backgroundPurple} />
                        </TouchableOpacity>
                        <T size={fontSize.subtitleLarge} weight="600" color="#1F2937" style={styles.headerCenter}>
                            {t('common.back')}
                        </T>
                    </View>
                ) : null}

                <T size={fontSize.title} weight="700" color="#374151" style={styles.pageTitle}>
                    {t('settings.title')}
                </T>

                <View style={styles.section}>
                    <T size={fontSize.subtitle} weight="600" color="#1F2937" style={styles.sectionTitle}>
                        {t('settings.language')}
                    </T>

                    <TouchableOpacity
                        style={styles.row}
                        onPress={() => setLocale('tr')}
                        activeOpacity={0.8}>
                        <View style={styles.langOption}>
                            <View style={styles.radio}>
                                {locale === 'tr' && <View style={styles.radioInner} />}
                            </View>
                            <T size={fontSize.subtitle} weight="500" color="#111827">
                                {t('settings.langTr')}
                            </T>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.row}
                        onPress={() => setLocale('en')}
                        activeOpacity={0.8}>
                        <View style={styles.langOption}>
                            <View style={styles.radio}>
                                {locale === 'en' && <View style={styles.radioInner} />}
                            </View>
                            <T size={fontSize.subtitle} weight="500" color="#111827">
                                {t('settings.langEn')}
                            </T>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <T size={fontSize.subtitle} weight="600" color="#1F2937" style={styles.sectionTitle}>
                        {t('settings.profileSettings')}
                    </T>
                    <TouchableOpacity
                        style={styles.deleteRow}
                        onPress={() => setLogoutModalVisible(true)}
                        activeOpacity={0.8}>
                        <View style={styles.deleteIconWrap}>
                            <Ionicons name="exit-outline" size={iconSize.medium} color="#B91C1C" />
                        </View>
                        <T size={fontSize.subtitle} weight="500" color="#B91C1C" style={{ flex: 1 }}>
                            {t('settings.logout')}
                        </T>
                    </TouchableOpacity>
                </View>
            </View>

            <PopupModal
                visible={logoutModalVisible}
                title={t('logout.title')}
                type="info"
                leftButtonText={t('logout.cancel')}
                rightButtonText={t('logout.confirm')}
                onLeftPress={() => setLogoutModalVisible(false)}
                onRightPress={handleLogoutConfirm}
            />
        </GradientLayout>
    );
};

export default Settings;
