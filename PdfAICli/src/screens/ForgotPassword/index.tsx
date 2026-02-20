import React, { useState, useMemo } from 'react';
import {
    View,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    ScrollView,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { forgotPassword } from '../../server/api/User';
import Button from '../../components/Buttons/Button';
import T from '../../components/Text/T';
import PopupModal from '../../components/Modals/PopupModal';
import TextInputComponent from '../../components/Inputs/TextInputComponent';
import { useResponsive } from '../../utils/deviceStore/device';
import colors from '../../theme/colors';
import { fontSize } from '../../constants/typography';
import GradientLayout from '../../components/Layout/GradientLayout';
import { useT } from '../../store/useLocaleStore';

const ForgotPassword: React.FC = () => {
    const nav = useNavigation<any>();
    const t = useT();
    const { w1px, h1px } = useResponsive();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type?: 'error' | 'warning' | 'success';
    }>({ visible: false, title: '', message: '' });

    const s = useMemo(
        () =>
            StyleSheet.create({
                container: {
                    flex: 1,
                    padding: 16 * w1px,
                },
                scrollContent: {
                    flexGrow: 1,
                    justifyContent: 'center',
                    paddingVertical: 24 * h1px,
                    paddingBottom: 48 * h1px,
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
                buttonRow: {
                    flexDirection: 'row',
                    alignItems: 'stretch',
                    gap: 12 * w1px,
                    marginTop: 4 * h1px,
                },
                buttonWrap: {
                    flex: 1,
                    minWidth: 0,
                },
            }),
        [w1px, h1px],
    );

    const handleSubmit = async () => {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed) {
            setModal({
                visible: true,
                title: t('common.warning'),
                message: t('forgotPassword.warnEmail'),
                type: 'warning',
            });
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            setModal({
                visible: true,
                title: t('common.warning'),
                message: t('register.warnValidEmail'),
                type: 'warning',
            });
            return;
        }

        try {
            setLoading(true);
            const res = await forgotPassword(trimmed);
            if (res?.ok && res?.email) {
                nav.replace('ResetPassword', { email: res.email });
                return;
            }
            setModal({
                visible: true,
                title: t('common.warning'),
                message: t('forgotPassword.emailNotRegistered'),
                type: 'warning',
            });
        } catch (e: any) {
            const is404 = e?.response?.status === 404;
            setModal({
                visible: true,
                title: is404 ? t('common.warning') : t('common.error'),
                message: is404
                    ? t('forgotPassword.emailNotRegistered')
                    : e?.message || t('common.genericError'),
                type: is404 ? 'warning' : 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setModal({ visible: false, title: '', message: '' });
    };

    return (
        <GradientLayout>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={s.container}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}>
                <ScrollView
                    contentContainerStyle={s.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={s.card}>
                            <T
                                size={fontSize.display}
                                weight="900"
                                color={colors.backgroundPurple}
                                style={{ marginBottom: 24 * h1px, textAlign: 'center' }}>
                                {t('forgotPassword.title')}
                            </T>
                    <T
                        size={fontSize.body}
                        color={colors.textDark}
                        style={{ marginBottom: 16 * h1px, textAlign: 'center' }}>
                        {t('forgotPassword.subtitleNoCode')}
                    </T>
                            <TextInputComponent
                                label={t('forgotPassword.emailLabel')}
                                placeholder={t('register.emailPlaceholder')}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                returnKeyType="done"
                                onSubmitEditing={handleSubmit}
                                containerStyle={{ marginBottom: 12 * h1px }}
                            />
                            <View style={s.buttonRow}>
                                <View style={s.buttonWrap}>
                                    <Button
                                        buttonText={t('common.back')}
                                        onPress={() => nav.goBack()}
                                        disabled={loading}
                                        backgroundColor={colors.buttonGray}
                                    />
                                </View>
                                <View style={s.buttonWrap}>
                                    <Button
                                        buttonText={t('forgotPassword.continueButton')}
                                        onPress={handleSubmit}
                                        activityIndicatorLoading={loading}
                                        disabled={loading || !email.trim()}
                                    />
                                </View>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </ScrollView>
            </KeyboardAvoidingView>

            <PopupModal
                visible={modal.visible}
                title={modal.title}
                message={modal.message}
                type={modal.type ?? 'warning'}
                rightButtonText={t('common.ok')}
                onRightPress={closeModal}
            />
        </GradientLayout>
    );
};

export default ForgotPassword;
