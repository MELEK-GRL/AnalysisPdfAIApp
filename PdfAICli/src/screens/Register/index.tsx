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
import CenterModal from '../../components/Modals/CenterModal';
import TextInputComponent from '../../components/Inputs/TextInputComponent';
import { useResponsive } from '../../utils/deviceStore/device';
import colors from '../../theme/colors';
import GradientLayout from '../../components/Layout/GradientLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../server/apiFetcher';

async function getInstallationId() {
    let id = await AsyncStorage.getItem('installation_id');
    if (!id) {
        id = `${Platform.OS}-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 10)}`;
        await AsyncStorage.setItem('installation_id', id);
    }
    return id;
}

const Register: React.FC = () => {
    const nav = useNavigation<any>();
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
                title: 'Uyarı',
                message: 'Ad Soyad gerekli.',
            });
        }
        if (!emailT) {
            return setModal({
                visible: true,
                title: 'Uyarı',
                message: 'E-posta gerekli.',
            });
        }
        if (!passT) {
            return setModal({
                visible: true,
                title: 'Uyarı',
                message: 'Şifre gerekli.',
            });
        }
        if (!confT) {
            return setModal({
                visible: true,
                title: 'Uyarı',
                message: 'Şifre tekrar gerekli.',
            });
        }

        const emailOk = /\S+@\S+\.\S+/.test(emailT);
        if (!emailOk) {
            return setModal({
                visible: true,
                title: 'Uyarı',
                message: 'Geçerli e-posta girin.',
            });
        }
        if (passT.length < 6) {
            return setModal({
                visible: true,
                title: 'Uyarı',
                message: 'Şifre en az 6 karakter olmalıdır.',
            });
        }
        if (passT !== confT) {
            return setModal({
                visible: true,
                title: 'Uyarı',
                message: 'Şifreler eşleşmiyor.',
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

                const consentId = await AsyncStorage.getItem('last_consent_id');
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
                console.warn('Post-register attach/session failed:', e?.message || e);
            }

            await useAuthStore.getState().setUserAndToken(user, token);

            setModal({
                visible: true,
                title: 'Başarılı',
                message: 'Kayıt tamamlandı.',
                type: 'success',
            });
            setTimeout(() => nav.replace('Home'), 600);
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                'Kayıt başarısız. Lütfen tekrar deneyin.';
            setModal({ visible: true, title: 'Hata', message: msg, type: 'error' });
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
                            color={colors.backgroundPruple}
                            style={{ marginBottom: 28 * h1px, textAlign: 'center' }}>
                            Kayıt Ol
                        </T>

                        <TextInputComponent
                            label="Ad Soyad"
                            placeholder="Ad Soyad"
                            value={form.name}
                            onChangeText={v => handleChange('name', v)}
                            returnKeyType="next"
                            containerStyle={{ marginBottom: 10 * h1px }}
                        />

                        <TextInputComponent
                            label="E-posta"
                            placeholder="E-posta adresiniz"
                            value={form.email}
                            onChangeText={v => handleChange('email', v)}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            returnKeyType="next"
                            containerStyle={{ marginBottom: 10 * h1px }}
                        />

                        <TextInputComponent
                            label="Şifre"
                            placeholder="Şifre"
                            value={form.password}
                            onChangeText={v => handleChange('password', v)}
                            secureTextEntry
                            returnKeyType="next"
                            containerStyle={{ marginBottom: 10 * h1px }}
                        />

                        <TextInputComponent
                            label="Şifre Tekrar"
                            placeholder="Şifre Tekrar"
                            value={form.confirm}
                            onChangeText={v => handleChange('confirm', v)}
                            secureTextEntry
                            returnKeyType="done"
                            containerStyle={{ marginBottom: 4 * h1px }}
                        />

                        <Button
                            buttonText="Hesap Oluştur"
                            onPress={onRegister}
                            activityIndicatorLoading={loading}
                            style={{ marginTop: 12 * h1px }}
                            width={h1px * 260}
                        />

                        <View style={s.textStyle}>
                            <T size={17} color={colors.textDark}>
                                Zaten hesabın var mı?
                            </T>
                            <View style={s.textStyleLeft}>
                                <T
                                    size={17}
                                    weight="800"
                                    color={colors.backgroundPruple}
                                    onPress={() => nav.goBack()}>
                                    Giriş yap
                                </T>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>

                <CenterModal
                    visible={modal.visible}
                    title={modal.title}
                    message={modal.message}
                    rightButtonText="Tamam"
                    onRightPress={() =>
                        setModal({ visible: false, title: '', message: '' })
                    }
                />
            </SafeAreaView>
        </GradientLayout>
    );
};

export default Register;
