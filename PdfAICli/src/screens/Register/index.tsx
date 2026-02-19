import React, { useState, useMemo } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
    register as registerApi,
    login as loginApi,
} from '../../server/api/User';
import Button from '../../components/Buttons/Button';
import T from '../../components/Text/T';
import PopupModal from '../../components/Modals/PopupModal';
import TextInputComponent from '../../components/Inputs/TextInputComponent';
import { useResponsive } from '../../utils/deviceStore/device';
import colors from '../../theme/colors';
import GradientLayout from '../../components/Layout/GradientLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { useLocaleStore } from '../../store/useLocaleStore';
import { useScreenTime } from '../../utils/analytics/useScreenTime';
import { getInstallationId } from '../../utils/analytics/getInstallationId';
import { api } from '../../server/apiFetcher';
import { LAST_CONSENT_ID } from '../../constants/storageKeys';

const Register: React.FC = () => {
    const nav = useNavigation<any>();
    useScreenTime('Register');
    const t = useLocaleStore((s) => s.t);
    const { w1px, h1px, fs1px } = useResponsive();
    const setUserAndToken = useAuthStore(s => s.setUserAndToken);

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirm: '',
    });
    const [loading, setLoading] = useState(false);

    const [modal, setModal] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type?: 'success' | 'error' | 'warning';
    }>({ visible: false, title: '', message: '' });

    const s = useMemo(
        () =>
            StyleSheet.create({
                container: { flex: 1, padding: 16 * w1px, justifyContent: 'center' },
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

    const handleChange = (key: keyof typeof form, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const validate = () => {
        const { name, email, password, confirm } = form;
        const nameT = name.trim();
        const emailT = email.trim();
        const passT = password.trim();
        const confT = confirm.trim();

        if (!nameT) {
            return setModal({
                visible: true,
                title: t('common.warning'),
                message: t('register.warnName'),
                type: 'warning',
            });
        }
        if (!emailT) {
            return setModal({
                visible: true,
                title: t('common.warning'),
                message: t('register.warnEmail'),
                type: 'warning',
            });
        }
        if (!passT) {
            return setModal({
                visible: true,
                title: t('common.warning'),
                message: t('register.warnPassword'),
                type: 'warning',
            });
        }
        if (!confT) {
            return setModal({
                visible: true,
                title: t('common.warning'),
                message: t('register.warnConfirm'),
                type: 'warning',
            });
        }

        const emailOk = /\S+@\S+\.\S+/.test(emailT);
        if (!emailOk) {
            return setModal({
                visible: true,
                title: t('common.warning'),
                message: t('register.warnValidEmail'),
                type: 'warning',
            });
        }
        if (passT.length < 6) {
            return setModal({
                visible: true,
                title: t('common.warning'),
                message: t('register.warnPasswordLength'),
                type: 'warning',
            });
        }
        if (passT !== confT) {
            return setModal({
                visible: true,
                title: t('common.warning'),
                message: t('register.warnPasswordMatch'),
                type: 'warning',
            });
        }

        return true;
    };

    const onRegister = async () => {
        if (validate() !== true) {
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: form.name.trim(),
                email: form.email.trim(),
                password: form.password.trim(),
                passwordConfirm: form.confirm.trim(),
                confirmPassword: form.confirm.trim(),
                password_confirmation: form.confirm.trim(),
            };
            const regRes = await registerApi(payload);
            let token = regRes?.token;
            let user = regRes?.user;

            if (!token) {
                const loginRes = await loginApi({
                    identifier: form.email.trim(),
                    password: form.password.trim(),
                });
                token = loginRes.token;
                user = loginRes.user;
            }

            if (!token || !user) {
                throw new Error('Kayıt sonrası oturum açılamadı.');
            }
            try {
                const installationId = await getInstallationId();
                const headers = { headers: { Authorization: `Bearer ${token}` } };

                const consentId = await AsyncStorage.getItem(LAST_CONSENT_ID);
                if (consentId) {
                    await api.post(`/consents/${consentId}/attach`, {}, headers);
                } else {
                    await api.post(
                        '/consents/attach-by-installation',
                        { installationId },
                        headers,
                    );
                }

                await api.post(
                    '/auth/session',
                    { installationId, device: { platform: Platform.OS } },
                    headers,
                );
            } catch (e: any) {
                if (__DEV__) {
                    console.warn('Post-register attach/session failed:', e?.message || e);
                }
            }

            await useAuthStore.getState().setUserAndToken(user, token);

            setModal({
                visible: true,
                title: t('register.successTitle'),
                message: t('register.success'),
                type: 'success',
            });
            setTimeout(() => nav.replace('MainTabs'), 600);
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                t('register.error');
            setModal({
                visible: true,
                title: t('common.error'),
                message: msg,
                type: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <GradientLayout>
            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={s.container}>
                    <View style={s.card}>
                        <T
                            size={24}
                            weight="900"
                            color={colors.backgroundPurple}
                            style={{ marginBottom: 28 * h1px, textAlign: 'center' }}>
                            {t('register.title')}
                        </T>

                        <TextInputComponent
                            label={t('register.namePlaceholder')}
                            placeholder={t('register.namePlaceholder')}
                            value={form.name}
                            onChangeText={v => handleChange('name', v)}
                            returnKeyType="next"
                            containerStyle={{ marginBottom: 10 * h1px }}
                        />

                        <TextInputComponent
                            label={t('register.emailPlaceholder')}
                            placeholder={t('register.emailPlaceholder')}
                            value={form.email}
                            onChangeText={v => handleChange('email', v)}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            returnKeyType="next"
                            containerStyle={{ marginBottom: 10 * h1px }}
                        />

                        <TextInputComponent
                            label={t('register.passwordPlaceholder')}
                            placeholder={t('register.passwordPlaceholder')}
                            value={form.password}
                            onChangeText={v => handleChange('password', v)}
                            secureTextEntry
                            returnKeyType="next"
                            containerStyle={{ marginBottom: 10 * h1px }}
                        />

                        <TextInputComponent
                            label={t('register.confirmPlaceholder')}
                            placeholder={t('register.confirmPlaceholder')}
                            value={form.confirm}
                            onChangeText={v => handleChange('confirm', v)}
                            secureTextEntry
                            returnKeyType="done"
                            containerStyle={{ marginBottom: 4 * h1px }}
                        />

                        <Button
                            buttonText={t('register.button')}
                            onPress={onRegister}
                            activityIndicatorLoading={loading}
                            style={{ marginTop: 12 * h1px }}
                            width={h1px * 260}
                        />

                        <View style={s.textStyle}>
                            <T size={17} color={colors.textDark}>
                                {t('register.hasAccount')}
                            </T>
                            <View style={s.textStyleLeft}>
                                <T
                                    size={17}
                                    weight="800"
                                    color={colors.backgroundPurple}
                                    onPress={() => nav.goBack()}>
                                    {t('register.login')}
                                </T>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>

                <PopupModal
                    visible={modal.visible}
                    title={modal.title}
                    message={modal.message}
                    type={modal.type === 'error' ? 'error' : modal.type === 'success' ? 'success' : 'warning'}
                    rightButtonText={t('common.ok')}
                    onRightPress={() =>
                        setModal({ visible: false, title: '', message: '' })
                    }
                />
            </SafeAreaView>
        </GradientLayout>
    );
};

export default Register;
