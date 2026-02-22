import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useNavigation, CommonActions } from '@react-navigation/native';
import { useSessionStore } from '../../store/useSessionStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useScreenTime } from '../../utils/analytics/useScreenTime';
import { useT } from '../../store/useLocaleStore';
import { useResponsive } from '../../utils/deviceStore/device';
import Header from '../../components/Header/Header';
import PageHeader from '../../components/PageHeader/PageHeader';
import PageLayout from '../../components/Layout/PageLayout';
import GradientLayout from '../../components/Layout/GradientLayout';
import PopupModal from '../../components/Modals/PopupModal';
import T from '../../components/Text/T';
import colors from '../../theme/colors';
import { fontSize } from '../../constants/typography';
import { iconSize } from '../../constants/icons';
import { deleteAccount } from '../../server/api/User';

/**
 * Profil sayfası – bottom menüden "Profil" sekmesine tıklanınca açılır.
 * Diğer sayfalarla aynı yapı: GradientLayout, Header (kullanıcı adı), PageLayout.
 */
const Profile: React.FC = () => {
    const t = useT();
    const nav = useNavigation<any>();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const displayName = user?.name ?? '';
    const { w1px, h1px } = useResponsive();
    const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);
    const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);

    useScreenTime('Profile');
    useFocusEffect(
        useCallback(() => {
            useSessionStore.getState().touch();
        }, []),
    );

    const styles = useMemo(
        () =>
            StyleSheet.create({
                contentView: {
                    flex: 1,
                    backgroundColor: colors.white,
                },
                userCard: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#fff',
                    borderRadius: 14 * w1px,
                    paddingVertical: 12 * h1px,
                    paddingHorizontal: 14 * w1px,
                    marginBottom: 18 * h1px,
                    borderWidth: 1,
                    borderColor: 'rgba(116, 83, 224, 0.15)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 5,
                    elevation: 2,
                },
                userAvatarWrap: {
                    width: 42 * w1px,
                    height: 42 * w1px,
                    borderRadius: 21 * w1px,
                    backgroundColor: colors.backgroundPurpleSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12 * w1px,
                },
                userInfo: { flex: 1 },
                userLabel: { marginBottom: 2 * h1px },
                userEmailLabel: { marginTop: 4 * h1px, marginBottom: 2 * h1px },
                deleteRow: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#fff',
                    borderRadius: 10 * w1px,
                    paddingVertical: 12 * h1px,
                    paddingHorizontal: 12 * w1px,
                    marginBottom: 8 * h1px,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    gap: 10 * w1px,
                },
                deleteIconWrap: {
                    width: 30 * w1px,
                    height: 30 * w1px,
                    borderRadius: 15 * w1px,
                    backgroundColor: '#F5F5F5',
                    alignItems: 'center',
                    justifyContent: 'center',
                },
            }),
        [w1px, h1px],
    );

    const handleDeleteAccountConfirm = useCallback(async () => {
        setDeleteAccountLoading(true);
        try {
            await deleteAccount();
            setDeleteAccountModalVisible(false);
            await logout();
            nav.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
        } catch (_) {
            setDeleteAccountModalVisible(false);
        } finally {
            setDeleteAccountLoading(false);
        }
    }, [logout, nav]);

    return (
        <GradientLayout>
            <View style={styles.contentView}>
                <Header title={displayName} />
                <PageLayout>
                    <PageHeader title={t('tabs.profile')} />
                    {(user?.name ?? user?.email) ? (
                        <View style={styles.userCard}>
                            <View style={styles.userAvatarWrap}>
                                <Ionicons name="person" size={26} color={colors.backgroundPurple} />
                            </View>
                            <View style={styles.userInfo}>
                                {user?.name ? (
                                    <>
                                        <T size={fontSize.bodySmall} weight="600" color={colors.textGraySoft} style={styles.userLabel}>
                                            {t('settings.userName')}
                                        </T>
                                        <T size={fontSize.subtitle} weight="600" color="#1F2937">
                                            {user.name}
                                        </T>
                                    </>
                                ) : null}
                                {user?.email ? (
                                    <>
                                        <T size={fontSize.bodySmall} weight="600" color={colors.textGraySoft} style={styles.userEmailLabel}>
                                            {t('settings.email')}
                                        </T>
                                        <T size={fontSize.subtitle} weight="600" color="#1F2937">
                                            {user.email}
                                        </T>
                                    </>
                                ) : null}
                            </View>
                        </View>
                    ) : null}
                    <TouchableOpacity
                        style={styles.deleteRow}
                        onPress={() => setDeleteAccountModalVisible(true)}
                        activeOpacity={0.8}
                        disabled={deleteAccountLoading}>
                        <View style={styles.deleteIconWrap}>
                            <Ionicons name="trash-outline" size={iconSize.medium} color="#B91C1C" />
                        </View>
                        {deleteAccountLoading ? (
                            <ActivityIndicator size="small" color="#B91C1C" style={{ flex: 1 }} />
                        ) : (
                            <T size={fontSize.subtitle} weight="500" color="#B91C1C" style={{ flex: 1 }}>
                                {t('settings.deleteAccount')}
                            </T>
                        )}
                    </TouchableOpacity>
                    <View style={{ flex: 1 }} />
                </PageLayout>
            <PopupModal
                visible={deleteAccountModalVisible}
                title={t('settings.deleteAccountConfirmTitle')}
                message={t('settings.deleteAccountConfirmMessage')}
                type="warning"
                leftButtonText={t('common.cancel')}
                rightButtonText={t('settings.deleteAccountConfirm')}
                onLeftPress={() => setDeleteAccountModalVisible(false)}
                onRightPress={handleDeleteAccountConfirm}
            />
            </View>
        </GradientLayout>
    );
};

export default Profile;
