import React, { useCallback, useMemo, useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TextInput,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '../../store/useAuthStore';
import { useSessionStore } from '../../store/useSessionStore';
import { useScreenTime } from '../../utils/analytics/useScreenTime';
import { useT } from '../../store/useLocaleStore';
import { useResponsive } from '../../utils/deviceStore/device';
import { useTypography } from '../../theme/useTypography';
import type { ProfileStackParamList } from '../../navigation/profileNavigation';
import Header from '../../components/Header/Header';
import PageHeader from '../../components/PageHeader/PageHeader';
import PageLayout from '../../components/Layout/PageLayout';
import GradientLayout from '../../components/Layout/GradientLayout';
import Button from '../../components/Buttons/Button';
import PopupModal from '../../components/Modals/PopupModal';
import T from '../../components/Text/T';
import colors from '../../theme/colors';
import { fontSize } from '../../constants/typography';
import { iconSize } from '../../constants/icons';
import { sendSupportMessage } from '../../server/api/User';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE = 2000;

type Props = NativeStackScreenProps<ProfileStackParamList, 'HelpSupport'>;

const HelpSupport: React.FC<Props> = ({ navigation }) => {
    useScreenTime('HelpSupport');

    const t = useT();
    const user = useAuthStore(s => s.user);
    const displayName = user?.name ?? '';
    const { w1px, h1px } = useResponsive();
    const { scale } = useTypography();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [messageFocused, setMessageFocused] = useState(false);
    const [resultVisible, setResultVisible] = useState(false);
    const [resultOk, setResultOk] = useState(false);
    const [resultMsg, setResultMsg] = useState('');
    const [resultType, setResultType] = useState<
        'error' | 'warning' | 'success'
    >('error');

    useFocusEffect(
        useCallback(() => {
            useSessionStore.getState().touch();
            setName(user?.name ?? '');
            setEmail(user?.email ?? '');
        }, [user?.name, user?.email]),
    );

    const styles = useMemo(
        () =>
            StyleSheet.create({
                contentView: {
                    flex: 1,
                    backgroundColor: colors.white,
                },
                hintBand: {
                    flexDirection: 'row',
                    alignItems: 'stretch',
                    marginBottom: 18 * h1px,
                    borderRadius: 12 * w1px,
                    overflow: 'hidden',
                    backgroundColor: colors.backgroundPurpleSoft,
                    borderWidth: 1,
                    borderColor: 'rgba(116, 83, 224, 0.12)',
                },
                hintAccent: {
                    width: 4 * w1px,
                    backgroundColor: colors.backgroundPurple,
                },
                hintBody: {
                    flex: 1,
                    paddingVertical: 10 * h1px,
                    paddingHorizontal: 12 * w1px,
                },
                identityCol: {
                    gap: 8 * h1px,
                    marginBottom: 12 * h1px,
                },
                identityChip: {
                    backgroundColor: '#F8F7FC',
                    borderRadius: 10 * w1px,
                    paddingVertical: 8 * h1px,
                    paddingHorizontal: 10 * w1px,
                    borderWidth: 1,
                    borderColor: 'rgba(116, 83, 224, 0.1)',
                },
                chipTop: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6 * w1px,
                    marginBottom: 4 * h1px,
                },
                messageShell: {
                    borderRadius: 14 * w1px,
                    borderWidth: 1.5,
                    borderColor: 'rgba(116, 83, 224, 0.18)',
                    backgroundColor: colors.white,
                    paddingTop: 10 * h1px,
                    paddingHorizontal: 12 * w1px,
                    paddingBottom: 8 * h1px,
                    marginBottom: 14 * h1px,
                    shadowColor: colors.backgroundPurple,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.04,
                    shadowRadius: 6,
                    elevation: 1,
                },
                messageShellFocused: {
                    borderColor: colors.backgroundPurple,
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 3,
                },
                messageHeader: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8 * h1px,
                },
                messageHeaderLeft: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6 * w1px,
                },
                messageInput: {
                    minHeight: 150 * h1px,
                    maxHeight: 220 * h1px,
                    textAlignVertical: 'top',
                    fontSize: fontSize.body * scale,
                    lineHeight: fontSize.body * scale * 1.45,
                    color: colors.textDark,
                    padding: 0,
                },
                sendWrap: {
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 24 * h1px,
                },
            }),
        [w1px, h1px, scale],
    );

    const showResult = useCallback(
        (
            ok: boolean,
            msg: string,
            type: 'error' | 'warning' | 'success' = ok ? 'success' : 'error',
        ) => {
            setResultOk(ok);
            setResultMsg(msg);
            setResultType(type);
            setResultVisible(true);
        },
        [],
    );

    const handleSend = useCallback(async () => {
        const trimmedName = name.trim();
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedMessage = message.trim();

        if (!trimmedName) {
            showResult(
                false,
                t('settings.helpSupportNameRequired'),
                'warning',
            );
            return;
        }
        if (!trimmedEmail) {
            showResult(
                false,
                t('settings.helpSupportEmailRequired'),
                'warning',
            );
            return;
        }
        if (!EMAIL_RE.test(trimmedEmail)) {
            showResult(false, t('register.warnValidEmail'), 'warning');
            return;
        }
        if (!trimmedMessage) {
            showResult(false, t('settings.helpSupportEmpty'), 'warning');
            return;
        }

        setSending(true);
        try {
            await sendSupportMessage({
                name: trimmedName,
                email: trimmedEmail,
                message: trimmedMessage,
            });
            setMessage('');
            showResult(true, t('settings.helpSupportSuccess'), 'success');
        } catch (err: any) {
            const detail =
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                err?.message;
            showResult(
                false,
                typeof detail === 'string' && detail.trim()
                    ? detail
                    : t('settings.helpSupportError'),
                'error',
            );
        } finally {
            setSending(false);
        }
    }, [name, email, message, showResult, t]);

    return (
        <GradientLayout>
            <View style={styles.contentView}>
                <Header title={displayName} />
                <PageLayout>
                    <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <ScrollView
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ flexGrow: 1 }}>
                                <PageHeader
                                    title={t('settings.helpSupportTitle')}
                                />

                                <View style={styles.hintBand}>
                                    <View style={styles.hintAccent} />
                                    <View style={styles.hintBody}>
                                        <T
                                            size={fontSize.body}
                                            weight="400"
                                            color={colors.textGraySoft}
                                            align="center">
                                            {t('settings.helpSupportHint')}
                                        </T>
                                    </View>
                                </View>

                                <View style={styles.identityCol}>
                                    <View style={styles.identityChip}>
                                        <View style={styles.chipTop}>
                                            <Ionicons
                                                name="person-outline"
                                                size={iconSize.small}
                                                color={colors.backgroundPurple}
                                            />
                                            <T
                                                size={fontSize.bodySmall}
                                                weight="600"
                                                color={colors.textGraySoft}>
                                                {t('settings.userName')}
                                            </T>
                                        </View>
                                        <T
                                            size={fontSize.subtitle}
                                            weight="500"
                                            color="#9CA3AF"
                                            numberOfLines={1}>
                                            {name || '—'}
                                        </T>
                                    </View>
                                    <View style={styles.identityChip}>
                                        <View style={styles.chipTop}>
                                            <Ionicons
                                                name="mail-outline"
                                                size={iconSize.small}
                                                color={colors.backgroundPurple}
                                            />
                                            <T
                                                size={fontSize.bodySmall}
                                                weight="600"
                                                color={colors.textGraySoft}>
                                                {t('settings.email')}
                                            </T>
                                        </View>
                                        <T
                                            size={fontSize.subtitle}
                                            weight="500"
                                            color="#9CA3AF"
                                            numberOfLines={1}>
                                            {email || '—'}
                                        </T>
                                    </View>
                                </View>

                                <View
                                    style={[
                                        styles.messageShell,
                                        messageFocused
                                            ? styles.messageShellFocused
                                            : null,
                                    ]}>
                                    <View style={styles.messageHeader}>
                                        <View style={styles.messageHeaderLeft}>
                                            <Ionicons
                                                name="create-outline"
                                                size={iconSize.small}
                                                color={colors.backgroundPurple}
                                            />
                                            <T
                                                size={fontSize.bodySmall}
                                                weight="600"
                                                color={colors.textGraySoft}>
                                                {t(
                                                    'settings.helpSupportMessageLabel',
                                                )}
                                            </T>
                                        </View>
                                        <T
                                            size={fontSize.caption}
                                            weight="400"
                                            color="#9CA3AF">
                                            {`${message.length}/${MAX_MESSAGE}`}
                                        </T>
                                    </View>
                                    <TextInput
                                        style={styles.messageInput}
                                        value={message}
                                        onChangeText={setMessage}
                                        placeholder={t(
                                            'settings.helpSupportPlaceholder',
                                        )}
                                        placeholderTextColor="#9CA3AF"
                                        multiline
                                        maxLength={MAX_MESSAGE}
                                        editable={!sending}
                                        onFocus={() => setMessageFocused(true)}
                                        onBlur={() => setMessageFocused(false)}
                                    />
                                </View>

                                <View style={styles.sendWrap}>
                                    <Button
                                        buttonText={t(
                                            'settings.helpSupportSend',
                                        )}
                                        width="72%"
                                        onPress={() => {
                                            void handleSend();
                                        }}
                                        disabled={sending}
                                        activityIndicatorLoading={sending}
                                    />
                                </View>
                            </ScrollView>
                        </TouchableWithoutFeedback>
                    </KeyboardAvoidingView>
                </PageLayout>

                <PopupModal
                    visible={resultVisible}
                    title={
                        resultOk
                            ? t('common.ok')
                            : resultType === 'warning'
                              ? t('common.warning')
                              : t('common.error')
                    }
                    message={resultMsg}
                    type={resultType}
                    rightButtonText={t('common.ok')}
                    onRightPress={() => {
                        setResultVisible(false);
                        if (resultOk) {
                            navigation.goBack();
                        }
                    }}
                />
            </View>
        </GradientLayout>
    );
};

export default HelpSupport;
