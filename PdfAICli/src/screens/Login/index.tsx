import React, { useState, useMemo } from 'react';
import { View, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { login } from '../../server/api/User';
import { getInstallationId } from '../../utils/analytics/getInstallationId';
import { trackEvent, trackButtonClick } from '../../server/api/Analytics';
import { useScreenTime } from '../../utils/analytics/useScreenTime';
import { useAuthStore } from '../../store/useAuthStore';
import { useT } from '../../store/useLocaleStore';
import { api } from '../../server/apiFetcher';

import Button from '../../components/Buttons/Button';
import T from '../../components/Text/T';
import PopupModal from '../../components/Modals/PopupModal';
import { useResponsive } from '../../utils/deviceStore/device';
import TextInputComponent from '../../components/Inputs/TextInputComponent';
import colors from '../../theme/colors';
import { fontSize } from '../../constants/typography';
import GradientLayout from '../../components/Layout/GradientLayout';
import {
    LAST_CONSENT_ID,
    CONSENT_GIVEN_ONCE,
    HAS_EVER_LOGGED_IN,
} from '../../constants/storageKeys';
import { isNetworkError } from '../../utils/errorUtils';

const Login: React.FC = () => {
    const nav = useNavigation<any>();
    useScreenTime('Login');
    const t = useT();
    const { w1px, h1px, fs1px } = useResponsive();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type?: 'error' | 'warning';
    }>({ visible: false, title: '', message: '' });

    const setUserAndToken = useAuthStore(s => s.setUserAndToken);
    const s = useMemo(
        () =>
            StyleSheet.create({
                container: {
                    flex: 1,
                    padding: 16 * w1px,
                    justifyContent: 'center',
                },
                card: {
                    backgroundColor: '#fff',
                    borderRadius: 12 * w1px,
                    padding: 16 * w1px,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowRadius: 12 * w1px,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 2,
                },
                textStyle: {
                    alignItems: 'center',
                    marginTop: 10 * h1px,
                    flexDirection: 'row',
                    justifyContent: 'center',
                },
                textStyleLeft: { marginLeft: w1px * 4 },
            }),
        [w1px, h1px, fs1px],
    );
    const handleLogin = async () => {
        if (!identifier || !password) {
            setModal({
                visible: true,
                title: t('common.warning'),
                message: t('login.warnEmpty'),
                type: 'warning',
            });
            return;
        }

        try {
            setLoading(true);
            const res = await login({
                identifier: identifier.trim(),
                password: password.trim(),
            });

            const token = res?.token;
            if (!token) {
                throw new Error('Token alınamadı.');
            }
            try {
                const installationId = await getInstallationId();
                const headers = { headers: { Authorization: `Bearer ${token}` } };
                const consentId = await AsyncStorage.getItem(LAST_CONSENT_ID);

                if (consentId) {
                    await api.post(`/consents/${consentId}/attach`, {}, headers);
                    await AsyncStorage.setItem(CONSENT_GIVEN_ONCE, '1');
                } else {
                    const r = await api.post(
                        '/consents/attach-by-installation',
                        { installationId },
                        headers,
                    );
                    if (r?.data?.ok) {
                        await AsyncStorage.setItem(CONSENT_GIVEN_ONCE, '1');
                    }
                }
                await api.post(
                    '/auth/session',
                    { installationId, device: { platform: Platform.OS } },
                    headers,
                );
            } catch (e: any) {
                const status = e?.response?.status;
                if (__DEV__ && status !== 404) {
                    console.warn('Post-login attach/session failed:', e?.message || e);
                }
            }
            await setUserAndToken(res.user, token);
            await AsyncStorage.setItem(HAS_EVER_LOGGED_IN, '1');
            trackEvent('login', { screen: 'Login' });

            nav.replace('MainTabs');
        } catch (e: any) {
            const rawMessage = e?.message || '';
            const message = isNetworkError(e)
                ? t('common.networkError')
                : rawMessage === 'Login failed' || e?.response?.status === 500
                  ? t('login.serverError')
                  : rawMessage || t('common.genericError');
            setModal({
                visible: true,
                title: t('login.errorTitle'),
                message,
                type: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <GradientLayout>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={s.container}>
                <View style={s.card}>
                    <T
                        size={fontSize.display}
                        weight="900"
                        color={colors.backgroundPurple}
                        style={{ marginBottom: 24 * h1px, textAlign: 'center' }}>
                        {t('login.title')}
                    </T>

                    <TextInputComponent
                        label={t('login.emailPlaceholder')}
                        placeholder={t('login.emailPlaceholder')}
                        value={identifier}
                        onChangeText={setIdentifier}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        returnKeyType="next"
                        containerStyle={{ marginBottom: 12 * h1px }}
                    />

                    <TextInputComponent
                        label={t('login.passwordPlaceholder')}
                        placeholder={t('login.passwordPlaceholder')}
                        value={password}
                        onChangeText={setPassword}
                        autoCapitalize="none"
                        secureTextEntry
                        passwordToggle
                        returnKeyType="done"
                        onSubmitEditing={handleLogin}
                        containerStyle={{ marginBottom: 4 * h1px }}
                    />
                    <View style={{ alignItems: 'flex-end', marginBottom: 12 * h1px }}>
                        <T
                            size={fontSize.body}
                            weight="600"
                            color={colors.backgroundPurple}
                            onPress={() => nav.navigate('ForgotPassword')}>
                            {t('login.forgotPassword')}
                        </T>
                    </View>

                    <Button
                        buttonText={t('login.button')}
                        onPress={() => {
                            trackButtonClick('login_submit', { screen: 'Login' });
                            handleLogin();
                        }}
                        activityIndicatorLoading={loading}
                        disabled={loading || !identifier || !password}
                        style={{ marginTop: 4 * h1px }}
                        width={h1px * 260}
                    />

                    <View style={s.textStyle}>
                        <T size={fontSize.subtitleLarge} color={colors.textDark}>
                            {t('login.noAccount')}
                        </T>
                        <View style={s.textStyleLeft}>
                            <T
                                size={fontSize.subtitleLarge}
                                weight="800"
                                color={colors.backgroundPurple}
                                onPress={() => nav.navigate('Register')}>
                                {t('login.register')}
                            </T>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>

            <PopupModal
                visible={modal.visible}
                title={modal.title}
                message={modal.message}
                type={modal.type ?? 'warning'}
                rightButtonText={t('common.ok')}
                onRightPress={() => setModal({ visible: false, title: '', message: '' })}
            />
        </GradientLayout>
    );
};

export default Login;
