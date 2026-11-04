import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
    View,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    ScrollView,
    Keyboard,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { resetPasswordByToken, resetPasswordByCode } from '../../server/api/User';
import Button from '../../components/Buttons/Button';
import BackButton from '../../components/Buttons/BackButton';
import T from '../../components/Text/T';
import PopupModal from '../../components/Modals/PopupModal';
import TextInputComponent from '../../components/Inputs/TextInputComponent';
import { useResponsive } from '../../utils/deviceStore/device';
import colors from '../../theme/colors';
import { fontSize } from '../../constants/typography';
import GradientLayout from '../../components/Layout/GradientLayout';
import { useT } from '../../store/useLocaleStore';
import { useKeyboardBottomInset } from '../../hooks/useKeyboardBottomInset';
import {
    PASSWORD_MIN_LENGTH,
    PASSWORD_MAX_LENGTH,
} from '../../constants/limits';

type ResetPasswordRoute = { ResetPassword: { token?: string; email?: string; devCode?: string } };

const ResetPassword: React.FC = () => {
    const nav = useNavigation<any>();
    const route = useRoute<RouteProp<ResetPasswordRoute, 'ResetPassword'>>();
    const tokenFromRoute = route.params?.token ?? '';
    const emailFromRoute = route.params?.email ?? '';
    const devCodeFromRoute = route.params?.devCode ?? '';
    const t = useT();
    const { w1px, h1px } = useResponsive();
    // Android’de klavye çoğu zaman overlay; neredeyse tam yükseklik padding gerekir
    const keyboardInset = useKeyboardBottomInset(
        Platform.OS === 'android' ? 0.92 : 0.7,
    );
    const keyboardOpen = keyboardInset > 0;
    const scrollRef = useRef<ScrollView>(null);
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

    /** Şifre / şifre tekrar odaklanınca alta kaydır */
    const scrollToLowerFields = useCallback(() => {
        setTimeout(() => {
            scrollRef.current?.scrollToEnd({ animated: true });
        }, 280);
    }, []);

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
                },
                scrollContent: {
                    flexGrow: 1,
                    justifyContent: keyboardOpen ? 'flex-start' : 'center',
                    paddingHorizontal: 16 * w1px,
                    paddingTop: keyboardOpen ? 8 * h1px : 16 * h1px,
                    paddingBottom: 32 * h1px + keyboardInset,
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
            }),
        [w1px, h1px, keyboardInset, keyboardOpen],
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
        if (
            newPassword.length < PASSWORD_MIN_LENGTH ||
            newPassword.length > PASSWORD_MAX_LENGTH
        ) {
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
                <View style={[s.container, s.scrollContent]}>
                    <BackButton onPress={() => nav.replace('Login')} />
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
                style={s.container}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}>
                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={s.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                    onScrollBeginDrag={Keyboard.dismiss}>
                    <BackButton onPress={() => nav.replace('Login')} />
                    <View style={s.card}>
                        <T
                            size={fontSize.display}
                            weight="900"
                            color={colors.backgroundPurple}
                            style={{
                                marginBottom: 24 * h1px,
                                textAlign: 'center',
                            }}>
                            {t('resetPassword.title')}
                        </T>
                        <T
                            size={fontSize.body}
                            color={colors.textDark}
                            style={{
                                marginBottom: 16 * h1px,
                                textAlign: 'center',
                            }}>
                            {emailFromRoute
                                ? t('resetPassword.subtitle')
                                : t('resetPassword.subtitleLink')}
                        </T>
                        {emailFromRoute ? (
                            <>
                                <TextInputComponent
                                    label={t('forgotPassword.emailLabel')}
                                    placeholder={t(
                                        'register.emailPlaceholder',
                                    )}
                                    value={emailFromRoute}
                                    editable={false}
                                    containerStyle={{
                                        marginBottom: 12 * h1px,
                                    }}
                                />
                                <TextInputComponent
                                    label={t('resetPassword.codeLabel')}
                                    placeholder={t(
                                        'resetPassword.codePlaceholder',
                                    )}
                                    value={code}
                                    onChangeText={v =>
                                        setCode(
                                            v.replace(/\D/g, '').slice(0, 6),
                                        )
                                    }
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    containerStyle={{
                                        marginBottom: devCodeFromRoute
                                            ? 4 * h1px
                                            : 12 * h1px,
                                    }}
                                />
                                {devCodeFromRoute ? (
                                    <T
                                        size={fontSize.caption}
                                        color={colors.textLight}
                                        style={{
                                            marginBottom: 12 * h1px,
                                        }}>
                                        {t('resetPassword.devCodeHint')}
                                    </T>
                                ) : null}
                            </>
                        ) : null}
                        <TextInputComponent
                            label={t('resetPassword.newPasswordLabel')}
                            placeholder={t(
                                'register.passwordHintPlaceholder',
                            )}
                            value={newPassword}
                            onChangeText={v =>
                                setNewPassword(v.replace(/\s/g, ''))
                            }
                            secureTextEntry
                            passwordToggle
                            maxLength={PASSWORD_MAX_LENGTH}
                            onFocus={scrollToLowerFields}
                            containerStyle={{
                                marginBottom: 12 * h1px,
                            }}
                        />
                        <TextInputComponent
                            label={t('register.confirmPlaceholder')}
                            placeholder={t(
                                'register.confirmPlaceholder',
                            )}
                            value={confirmPassword}
                            onChangeText={v =>
                                setConfirmPassword(v.replace(/\s/g, ''))
                            }
                            secureTextEntry
                            passwordToggle
                            maxLength={PASSWORD_MAX_LENGTH}
                            returnKeyType="done"
                            onFocus={scrollToLowerFields}
                            onSubmitEditing={handleSubmit}
                            containerStyle={{
                                marginBottom: 12 * h1px,
                            }}
                        />
                        <Button
                            buttonText={t('resetPassword.submitButton')}
                            onPress={handleSubmit}
                            activityIndicatorLoading={loading}
                            disabled={
                                loading ||
                                !newPassword ||
                                newPassword !== confirmPassword ||
                                (emailFromRoute
                                    ? code.trim().length !== 6
                                    : false)
                            }
                            style={{ marginTop: 4 * h1px }}
                            width={h1px * 260}
                        />
                    </View>
                </ScrollView>
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
