import React, { useState, useMemo, useCallback } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    TouchableOpacity,
    Modal,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
import { fontSize } from '../../constants/typography';
import { iconSize } from '../../constants/icons';
import GradientLayout from '../../components/Layout/GradientLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { useT } from '../../store/useLocaleStore';
import { useScreenTime } from '../../utils/analytics/useScreenTime';
import { getInstallationId } from '../../utils/analytics/getInstallationId';
import { api } from '../../server/apiFetcher';
import { LAST_CONSENT_ID } from '../../constants/storageKeys';
import TERMS_ITEMS from '../../utils/contractArticles/Articles.json';

const Register: React.FC = () => {
    const nav = useNavigation<any>();
    useScreenTime('Register');
    const t = useT();
    const { w1px, h1px, fs1px } = useResponsive();
    const setUserAndToken = useAuthStore(s => s.setUserAndToken);

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirm: '',
    });
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [termsModalVisible, setTermsModalVisible] = useState(false);
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
                container: { flex: 1 },
                scrollContent: {
                    flexGrow: 1,
                    padding: 16 * w1px,
                    paddingBottom: 24 * h1px,
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
                checkboxRow: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 16 * h1px,
                    marginBottom: 14 * h1px,
                    alignSelf: 'flex-start',
                },
                checkbox: {
                    width: 18 * w1px,
                    height: 18 * w1px,
                    borderWidth: 2,
                    borderColor: colors.backgroundPurple,
                    borderRadius: 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                termsLinkRow: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 14 * h1px,
                    paddingVertical: 6 * h1px,
                    paddingRight: 8 * w1px,
                },
            }),
        [w1px, h1px, fs1px],
    );

    const renderTermChild = useCallback(
        (child: { text: string }, cIdx: number) => (
            <View
                key={`c-${cIdx}`}
                style={{ marginTop: 4 * h1px, paddingLeft: 16 * w1px }}>
                <T size={fontSize.bodySmall} color="#4B5563">
                    • {child.text}
                </T>
            </View>
        ),
        [h1px, w1px],
    );

    const renderTermItem = useCallback(
        (item: any, idx: number) => (
            <View key={idx} style={{ marginTop: 8 * h1px }}>
                <T size={fontSize.bodyMedium} color="#374151">
                    {idx + 1}. {item.text}
                </T>
                {item.children?.length ? item.children.map(renderTermChild) : null}
            </View>
        ),
        [renderTermChild],
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
        if (!termsAccepted) {
            return setModal({
                visible: true,
                title: t('common.warning'),
                message: t('register.warnTerms'),
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
                termsAccepted: true,
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
                const status = e?.response?.status;
                if (__DEV__ && status !== 404) {
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
                    <ScrollView
                        style={s.container}
                        contentContainerStyle={s.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled">
                        <View style={s.card}>
                            <T
                            size={fontSize.display}
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

                        <View style={{ height: 8 * h1px }} />

                        <TouchableOpacity
                            onPress={() => setTermsAccepted(!termsAccepted)}
                            activeOpacity={0.8}
                            style={s.checkboxRow}>
                            <View
                                style={[
                                    s.checkbox,
                                    {
                                        backgroundColor: termsAccepted
                                            ? colors.backgroundPurple
                                            : '#fff',
                                    },
                                ]}>
                                {termsAccepted && (
                                    <Ionicons
                                        name="checkmark"
                                        size={13}
                                        color="#fff"
                                    />
                                )}
                            </View>
                            <T
                                size={fontSize.body}
                                color="#111827"
                                style={{ marginLeft: 8 * w1px, flex: 1 }}>
                                {t('register.termsCheckbox')}
                            </T>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setTermsModalVisible(true)}
                            activeOpacity={0.8}
                            style={s.termsLinkRow}>
                            <Ionicons
                                name="document-text-outline"
                                size={iconSize.medium}
                                color={colors.backgroundPurple}
                                style={{ marginRight: 6 * w1px }}
                            />
                            <T
                                size={fontSize.body}
                                weight="600"
                                color={colors.backgroundPurple}>
                                {t('register.viewTerms')}
                            </T>
                            <Ionicons
                                name="open-outline"
                                size={iconSize.small}
                                color={colors.backgroundPurple}
                                style={{ marginLeft: 4 * w1px }}
                            />
                        </TouchableOpacity>

                        <Button
                            buttonText={t('register.button')}
                            onPress={onRegister}
                            activityIndicatorLoading={loading}
                            disabled={!termsAccepted}
                            style={{ marginTop: 4 * h1px }}
                            width={h1px * 260}
                        />

                        <View style={s.textStyle}>
                            <T size={fontSize.subtitleLarge} color={colors.textDark}>
                                {t('register.hasAccount')}
                            </T>
                            <View style={s.textStyleLeft}>
                                <T
size={fontSize.subtitleLarge}
                                weight="800"
                                    color={colors.backgroundPurple}
                                    onPress={() => nav.goBack()}>
                                    {t('register.login')}
                                </T>
                            </View>
                        </View>
                        </View>
                    </ScrollView>
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

                <Modal
                    visible={termsModalVisible}
                    transparent
                    animationType="fade">
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: 'rgba(17,24,39,0.4)',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 20 * w1px,
                        }}>
                        <View
                            style={{
                                backgroundColor: '#fff',
                                borderRadius: 12 * w1px,
                                padding: 16 * w1px,
                                maxHeight: '85%',
                                width: '100%',
                            }}>
                            <T
                                size={fontSize.title}
                                weight="700"
                                color="#111827"
                                style={{ marginBottom: 12 * h1px }}>
                                {t('splash.termsTitle')}
                            </T>
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                style={{ maxHeight: 400 * h1px }}>
                                {TERMS_ITEMS.map(renderTermItem)}
                            </ScrollView>
                            <Button
                                buttonText={t('common.close')}
                                onPress={() => setTermsModalVisible(false)}
                                style={{ marginTop: 16 * h1px }}
                            />
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </GradientLayout>
    );
};

export default Register;
