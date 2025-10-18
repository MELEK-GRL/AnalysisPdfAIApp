import React, { useState, useMemo } from 'react';
import { View, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { login } from '../../server/api/User';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../server/apiFetcher';

import Button from '../../components/Buttons/Button';
import T from '../../components/Text/T';
import CenterModal from '../../components/Modals/CenterModal';
import { useResponsive } from '../../utils/deviceStore/device';
import TextInputComponent from '../../components/Inputs/TextInputComponent';
import colors from '../../theme/colors';
import GradientLayout from '../../components/Layout/GradientLayout';

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

const Login: React.FC = () => {
    const nav = useNavigation<any>();
    const { w1px, h1px, fs1px } = useResponsive();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState({
        visible: false,
        title: '',
        message: '',
    });

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
                title: 'Uyarı',
                message: 'Lütfen e-posta/kullanıcı adı ve şifreyi girin.',
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
                const consentId = await AsyncStorage.getItem('last_consent_id');

                if (consentId) {
                    await api.post(`/consents/${consentId}/attach`, {}, headers);
                    await AsyncStorage.setItem('consent_given_once', '1');
                } else {
                    const r = await api.post(
                        '/consents/attach-by-installation',
                        { installationId },
                        headers,
                    );
                    if (r?.data?.ok) {
                        await AsyncStorage.setItem('consent_given_once', '1');
                    }
                }
                await api.post(
                    '/auth/session',
                    { installationId, device: { platform: Platform.OS } },
                    headers,
                );
            } catch (e: any) {
                console.warn('Post-login attach/session failed:', e?.message || e);
            }
            await setUserAndToken(res.user, token);
            await AsyncStorage.setItem('has_ever_logged_in', '1');

            nav.replace('Home');
        } catch (e: any) {
            setModal({
                visible: true,
                title: 'Giriş Hatası',
                message: e?.message || 'Bir hata oluştu.',
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
                        size={24}
                        weight="900"
                        color={colors.backgroundPruple}
                        style={{ marginBottom: 24 * h1px, textAlign: 'center' }}>
                        Giriş Yap
                    </T>

                    <TextInputComponent
                        label="E-posta veya Kullanıcı Adı"
                        placeholder="E-posta veya kullanıcı adı"
                        value={identifier}
                        onChangeText={setIdentifier}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        returnKeyType="next"
                        containerStyle={{ marginBottom: 12 * h1px }}
                    />

                    <TextInputComponent
                        label="Şifre"
                        placeholder="Şifre"
                        value={password}
                        onChangeText={setPassword}
                        autoCapitalize="none"
                        secureTextEntry
                        returnKeyType="done"
                        onSubmitEditing={handleLogin}
                        containerStyle={{ marginBottom: 12 * h1px }}
                    />

                    <Button
                        buttonText="Giriş"
                        onPress={handleLogin}
                        activityIndicatorLoading={loading}
                        disabled={loading || !identifier || !password}
                        style={{ marginTop: 4 * h1px }}
                        width={h1px * 260}
                    />

                    <View style={s.textStyle}>
                        <T size={17} color={colors.textDark}>
                            Hesabın yok mu?
                        </T>
                        <View style={s.textStyleLeft}>
                            <T
                                size={17}
                                weight="800"
                                color={colors.backgroundPruple}
                                onPress={() => nav.navigate('Register')}>
                                Kayıt ol
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
                onRightPress={() => setModal({ visible: false, title: '', message: '' })}
            />
        </GradientLayout>
    );
};

export default Login;
