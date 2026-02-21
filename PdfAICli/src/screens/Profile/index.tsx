import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useSessionStore } from '../../store/useSessionStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useScreenTime } from '../../utils/analytics/useScreenTime';
import { useT } from '../../store/useLocaleStore';
import { useResponsive } from '../../utils/deviceStore/device';
import Header from '../../components/Header/Header';
import TitleHeader from '../../components/TitleHeader/TitleHeader';
import PageLayout from '../../components/Layout/PageLayout';
import GradientLayout from '../../components/Layout/GradientLayout';
import T from '../../components/Text/T';
import colors from '../../theme/colors';
import { fontSize } from '../../constants/typography';
import { iconSize } from '../../constants/icons';

/**
 * Profil sayfası – bottom menüden "Profil" sekmesine tıklanınca açılır.
 * Diğer sayfalarla aynı yapı: GradientLayout, Header (kullanıcı adı), PageLayout.
 */
const Profile: React.FC = () => {
    const t = useT();
    const user = useAuthStore((s) => s.user);
    const displayName = user?.name ?? '';
    const { w1px, h1px } = useResponsive();

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
                    borderRadius: 16 * w1px,
                    paddingVertical: 18 * h1px,
                    paddingHorizontal: 18 * w1px,
                    marginBottom: 24 * h1px,
                    borderWidth: 1,
                    borderColor: 'rgba(116, 83, 224, 0.15)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 6,
                    elevation: 2,
                },
                userAvatarWrap: {
                    width: 48 * w1px,
                    height: 48 * w1px,
                    borderRadius: 24 * w1px,
                    backgroundColor: colors.backgroundPurpleSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14 * w1px,
                },
                userInfo: { flex: 1 },
                userLabel: { marginBottom: 2 * h1px },
                userEmailLabel: { marginTop: 6 * h1px, marginBottom: 2 * h1px },
            }),
        [w1px, h1px],
    );

    return (
        <GradientLayout>
            <View style={styles.contentView}>
                <Header title={displayName} />
                <PageLayout>
                    <TitleHeader title={t('tabs.profile')} />
                    {(user?.name ?? user?.email) ? (
                        <View style={styles.userCard}>
                            <View style={styles.userAvatarWrap}>
                                <Ionicons name="person" size={26} color={colors.backgroundPurple} />
                            </View>
                            <View style={styles.userInfo}>
                                {user?.name ? (
                                    <>
                                        <T size={fontSize.captionLarge} weight="500" color="#6B7280" style={styles.userLabel}>
                                            {t('settings.userName')}
                                        </T>
                                        <T size={fontSize.subtitleLarge} weight="600" color="#1F2937">
                                            {user.name}
                                        </T>
                                    </>
                                ) : null}
                                {user?.email ? (
                                    <>
                                        <T size={fontSize.captionLarge} weight="500" color="#6B7280" style={styles.userEmailLabel}>
                                            {t('settings.email')}
                                        </T>
                                        <T size={fontSize.subtitleLarge} weight="600" color="#1F2937">
                                            {user.email}
                                        </T>
                                    </>
                                ) : null}
                            </View>
                        </View>
                    ) : null}
                    <View style={{ flex: 1 }} />
                </PageLayout>
            </View>
        </GradientLayout>
    );
};

export default Profile;
