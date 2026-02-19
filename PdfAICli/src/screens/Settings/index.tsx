import React, { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useLocaleStore } from '../../store/useLocaleStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useScreenTime } from '../../utils/analytics/useScreenTime';
import { useResponsive } from '../../utils/deviceStore/device';
import T from '../../components/Text/T';
import PopupModal from '../../components/Modals/PopupModal';
import colors from '../../theme/colors';
import GradientLayout from '../../components/Layout/GradientLayout';

const Settings: React.FC = () => {
    const nav = useNavigation<any>();
    useScreenTime('Settings');
    const { locale, setLocale, t } = useLocaleStore();
    const logout = useAuthStore(s => s.logout);
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
    const { w1px, h1px, fs1px } = useResponsive();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: {
                    flex: 1,
                    padding: 20 * w1px,
                },
                headerRow: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 24 * h1px,
                },
                backBtn: {
                    padding: 8 * w1px,
                    marginRight: 12 * w1px,
                },
                title: {
                    flex: 1,
                },
                section: {
                    marginBottom: 24 * h1px,
                },
                sectionTitle: {
                    marginBottom: 12 * h1px,
                    color: '#6B7280',
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
                    width: 22 * w1px,
                    height: 22 * w1px,
                    borderRadius: 11 * w1px,
                    borderWidth: 2,
                    borderColor: colors.backgroundPurple,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                radioInner: {
                    width: 12 * w1px,
                    height: 12 * w1px,
                    borderRadius: 6,
                    backgroundColor: colors.backgroundPurple,
                },
                logoutRow: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FEF2F2',
                    borderRadius: 12 * w1px,
                    paddingVertical: 16 * h1px,
                    paddingHorizontal: 16 * w1px,
                    marginTop: 20 * h1px,
                    borderWidth: 1,
                    borderColor: '#FECACA',
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
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => nav.goBack()}
                        activeOpacity={0.8}>
                        <Ionicons name="arrow-back" size={28} color="#111827" />
                    </TouchableOpacity>
                    <T size={24} weight="700" color="#111827" style={styles.title}>
                        {t('settings.title')}
                    </T>
                </View>

                <View style={styles.section}>
                    <T size={14} color="#6B7280" style={styles.sectionTitle}>
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
                            <T size={16} weight="500" color="#111827">
                                Türkçe
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
                            <T size={16} weight="500" color="#111827">
                                English
                            </T>
                        </View>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.logoutRow}
                    onPress={() => setLogoutModalVisible(true)}
                    activeOpacity={0.8}>
                    <T size={16} weight="600" color="#DC2626">
                        {t('settings.logout')}
                    </T>
                </TouchableOpacity>
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
