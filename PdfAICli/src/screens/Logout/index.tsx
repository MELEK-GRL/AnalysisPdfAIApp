import React, { useCallback, useState, useMemo } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { useLocaleStore } from '../../store/useLocaleStore';
import { useScreenTime } from '../../utils/analytics/useScreenTime';
import Button from '../../components/Buttons/Button';
import T from '../../components/Text/T';
import { useResponsive } from '../../utils/deviceStore/device';
import colors from '../../theme/colors';
import GradientLayout from '../../components/Layout/GradientLayout';

const Logout: React.FC = () => {
    const nav = useNavigation<any>();
    useScreenTime('Logout');
    const t = useLocaleStore((s) => s.t);
    const [loading, setLoading] = useState(false);
    const logout = useAuthStore(s => s.logout);
    const { w1px, h1px, fs1px } = useResponsive();

    const s = useMemo(
        () =>
            StyleSheet.create({
                container: {
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 16 * w1px,
                },
                card: {
                    width: '100%',
                    backgroundColor: '#fff',
                    borderRadius: 12 * w1px,
                    paddingVertical: 22 * h1px,
                    paddingHorizontal: 16 * w1px,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowRadius: 12 * w1px,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 2,
                },
                titleWrap: { alignItems: 'center', marginBottom: 18 * h1px },
                buttonContainer: {
                    gap: h1px * 12,
                    alignItems: 'center',
                },
            }),
        [w1px, h1px, fs1px],
    );

    const handleLogout = useCallback(async () => {
        if (loading) {
            return;
        }
        try {
            setLoading(true);
            await logout();
            nav.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
        } catch (e: any) {
            Alert.alert(t('common.error'), e?.message || t('logout.error'));
            setLoading(false);
        }
    }, [loading, logout, nav]);

    return (
        <GradientLayout>
            <View style={s.container}>
                <View style={s.card}>
                    <View style={s.titleWrap}>
                        <T size={20 * fs1px} weight="700" color="#111827" align="center">
                            {t('logout.title')}
                        </T>
                    </View>

                    <View style={s.buttonContainer}>
                        <Button
                            buttonText={t('logout.confirm')}
                            onPress={handleLogout}
                            activityIndicatorLoading={loading}
                            disabled={loading}
                            width={w1px * 250}
                        />
                        <Button
                            buttonText={t('logout.cancel')}
                            onPress={() => nav.goBack()}
                            activityIndicatorLoading={loading}
                            disabled={loading}
                            backgroundColor={colors.buttonGray}
                            width={w1px * 250}
                        />
                    </View>
                </View>
            </View>
        </GradientLayout>
    );
};

export default Logout;
