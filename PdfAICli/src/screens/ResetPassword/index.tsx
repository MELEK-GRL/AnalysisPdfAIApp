import React, { useState, useMemo, useEffect } from 'react';
import { View, KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { resetPasswordByToken, resetPasswordByCode } from '../../server/api/User';
import Button from '../../components/Buttons/Button';
import T from '../../components/Text/T';
import PopupModal from '../../components/Modals/PopupModal';
import TextInputComponent from '../../components/Inputs/TextInputComponent';
import { useResponsive } from '../../utils/deviceStore/device';
import colors from '../../theme/colors';
import { fontSize } from '../../constants/typography';
import GradientLayout from '../../components/Layout/GradientLayout';
import { useT } from '../../store/useLocaleStore';

type ResetPasswordRoute = { ResetPassword: { token?: string; email?: string; devCode?: string } };

const ResetPassword: React.FC = () => {
    const nav = useNavigation<any>();
    const route = useRoute<RouteProp<ResetPasswordRoute, 'ResetPassword'>>();
    const tokenFromRoute = route.params?.token ?? '';
    const emailFromRoute = route.params?.email ?? '';
    const devCodeFromRoute = route.params?.devCode ?? '';
    const t = useT();
    const { w1px, h1px } = useResponsive();
    const [code, setCode] = useState(devCodeFromRoute);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type?: 'error' | 'warning' | 'success';
    }>({ visible: false, title: '', message: '' });
    const [showExpiryHint, setShowExpiryHint] = useState(false);

    useEffect(() => {
        if (emailFromRoute) {
            const t = setTimeout(() => setShowExpiryHint(true), 400);
            return () => clearTimeout(t);
        }
    }, [emailFromRoute]);

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
                backRow: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 16 * h1px,
                },
            }),
        [w1px, h1px],
    );

    const handleSubmit = async () => {
        if (emailFromRoute) {
            const trimmedCode = code.trim();
            if (!trimmedCode || !/^\d{6}$/.test(trimmedCode)) {
                setModal({
                    visible: true,
                    title: t('common.warning'),
                    message: t('resetPassword.warnCode'),
                    type: 'warning',
                });
                return;
            }
        }
        if (!newPassword) {
            setModal({
                visible: true,
                title: t('common.warning'),
                message: t('register.warnPassword'),
                type: 'warning',
            });
            return;
        }
        if (newPassword.length < 6) {
            setModal({
                visible: true,
                title: t('common.warning'),
                message: t('register.warnPasswordLength'),
                type: 'warning',
            });
            return;
        }
        if (newPassword !== confirmPassword) {
            setModal({
                visible: true,
                title: t('common.warning'),
                message: t('register.warnPasswordMatch'),
                type: 'warning',
            });
            return;
        }

        try {
            setLoading(true);
            if (emailFromRoute) {
                await resetPasswordByCode(emailFromRoute, code.trim(), newPassword);
            } else {
                await resetPasswordByToken(tokenFromRoute, newPassword);
            }
            setModal({
                visible: true,
                title: t('resetPassword.successTitle'),
                message: t('resetPassword.successMessage'),
                type: 'success',
            });
        } catch (e: any) {
            setModal({
                visible: true,
                title: t('common.error'),
                message:
                    e?.response?.data?.message || e?.message || t('resetPassword.errorInvalidCode'),
                type: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const closeModalAndGoToLogin = () => {
        setModal({ visible: false, title: '', message: '' });
        if (modal.type === 'success') {
            nav.replace('Login');
        }
    };

    if (!tokenFromRoute && !emailFromRoute) {
        return (
            <GradientLayout>
                <View style={s.container}>
                    <TouchableOpacity
                        style={s.backRow}
                        onPress={() => nav.replace('Login')}
                        activeOpacity={0.7}>
                        <T size={fontSize.body} color={colors.backgroundPurple} weight="600">
                            {t('common.back')}
                        </T>
                    </TouchableOpacity>
                    <View style={s.card}>
                        <T
                            size={fontSize.display}
                            weight="900"
                            color={colors.backgroundPurple}
                            style={{ marginBottom: 24 * h1px, textAlign: 'center' }}>
                            {t('resetPassword.title')}
                        </T>
                        <T
                            size={fontSize.body}
                            color={colors.textDark}
                            style={{ marginBottom: 24 * h1px, textAlign: 'center' }}>
                            {t('resetPassword.noTokenHint')}
                        </T>
                        <Button
                            buttonText={t('login.title')}
                            onPress={() => nav.replace('Login')}
                            width={h1px * 260}
                        />
                    </View>
                </View>
            </GradientLayout>
        );
    }

    return (
        <GradientLayout>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={s.container}>
                <TouchableOpacity
                    style={s.backRow}
                    onPress={() => nav.replace('Login')}
                    activeOpacity={0.7}>
                    <T size={fontSize.body} color={colors.backgroundPurple} weight="600">
                        {t('common.back')}
                    </T>
                </TouchableOpacity>
                <View style={s.card}>
                    <T
                        size={fontSize.display}
                        weight="900"
                        color={colors.backgroundPurple}
                        style={{ marginBottom: 24 * h1px, textAlign: 'center' }}>
                        {t('resetPassword.title')}
                    </T>
                    <T
                        size={fontSize.body}
                        color={colors.textDark}
                        style={{ marginBottom: 16 * h1px, textAlign: 'center' }}>
                        {emailFromRoute ? t('resetPassword.subtitle') : t('resetPassword.subtitleLink')}
                    </T>
                    {emailFromRoute ? (
                        <>
                            <TextInputComponent
                                label={t('forgotPassword.emailLabel')}
                                placeholder={t('register.emailPlaceholder')}
                                value={emailFromRoute}
                                editable={false}
                                containerStyle={{ marginBottom: 12 * h1px }}
                            />
                            <TextInputComponent
                                label={t('resetPassword.codeLabel')}
                                placeholder={t('resetPassword.codePlaceholder')}
                                value={code}
                                onChangeText={v => setCode(v.replace(/\D/g, '').slice(0, 6))}
                                keyboardType="number-pad"
                                maxLength={6}
                                containerStyle={{ marginBottom: devCodeFromRoute ? 4 * h1px : 12 * h1px }}
                            />
                            {devCodeFromRoute ? (
                                <T
                                    size={fontSize.caption}
                                    color={colors.textLight}
                                    style={{ marginBottom: 12 * h1px }}>
                                    {t('resetPassword.devCodeHint')}
                                </T>
                            ) : null}
                        </>
                    ) : null}
                    <TextInputComponent
                        label={t('resetPassword.newPasswordLabel')}
                        placeholder={t('register.passwordPlaceholder')}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                        passwordToggle
                        containerStyle={{ marginBottom: 12 * h1px }}
                    />
                    <TextInputComponent
                        label={t('register.confirmPlaceholder')}
                        placeholder={t('register.confirmPlaceholder')}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        passwordToggle
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit}
                        containerStyle={{ marginBottom: 12 * h1px }}
                    />
                    <Button
                        buttonText={t('resetPassword.submitButton')}
                        onPress={handleSubmit}
                        activityIndicatorLoading={loading}
                        disabled={
                            loading ||
                            !newPassword ||
                            newPassword !== confirmPassword ||
                            (emailFromRoute ? code.trim().length !== 6 : false)
                        }
                        style={{ marginTop: 4 * h1px }}
                        width={h1px * 260}
                    />
                </View>
            </KeyboardAvoidingView>

            <PopupModal
                visible={modal.visible}
                title={modal.title}
                message={modal.message}
                type={modal.type ?? 'warning'}
                rightButtonText={t('common.ok')}
                onRightPress={closeModalAndGoToLogin}
            />
            {showExpiryHint && (
                <PopupModal
                    visible={showExpiryHint}
                    title={t('resetPassword.title')}
                    message={t('resetPassword.codeExpiryHint')}
                    type="warning"
                    rightButtonText={t('common.ok')}
                    onRightPress={() => setShowExpiryHint(false)}
                />
            )}
        </GradientLayout>
    );
};

export default ResetPassword;
