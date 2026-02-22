import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';

import DocumentPicker, {
    type DocumentPickerResponse,
} from 'react-native-document-picker';
import { useResponsive } from '../../utils/deviceStore/device';
import { getProfile } from '../../server/api/User';
import { getToken } from '../../server/apiFetcher';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { uploadPdf, LabItem } from '../../server/api/Lab';
import { useAuthStore } from '../../store/useAuthStore';
import { useT, useLocaleStore } from '../../store/useLocaleStore';
import { useAnalizResetStore } from '../../store/useAnalizResetStore';
import { useAnalysisLoadingStore } from '../../store/useAnalysisLoadingStore';
import { trackButtonClick } from '../../server/api/Analytics';
import { useScreenTime } from '../../utils/analytics/useScreenTime';
import PopupModal from '../../components/Modals/PopupModal';
import PageLayout from '../../components/Layout/PageLayout';
import T from '../../components/Text/T';
import colors from '../../theme/colors';
import { fontSize } from '../../constants/typography';
import { iconSize } from '../../constants/icons';
import Header from '../../components/Header/Header';
import PageHeader from '../../components/PageHeader/PageHeader';
import { MESSAGES } from '../../constants/messages';
import { useSessionStore } from '../../store/useSessionStore';
import PdfUploadSection from './PdfUploadSection';
import ResultSection from './ResultSection';

type Phase = 'idle' | 'loading' | 'result';

const Home: React.FC = () => {
    const nav = useNavigation<any>();
    useScreenTime('Home');
    const [phase, setPhase] = useState<Phase>('idle');
    const [fileName, setFileName] = useState<string | null>(null);
    const [pickedFile, setPickedFile] = useState<DocumentPickerResponse | null>(
        null,
    );
    const user = useAuthStore(s => s.user);
    const [displayName, setDisplayName] = useState<string>(user?.name || '');
    const [items, setItems] = useState<LabItem[]>([]);
    const [rawItems, setRawItems] = useState<LabItem[]>([]);
    const [analysis, setAnalysis] = useState<string>('');
    const [selectErrorVisible, setSelectErrorVisible] = useState(false);
    const [selectErrorMessage, setSelectErrorMessage] = useState<string>('');
    const [uploadSuccessVisible, setUploadSuccessVisible] = useState(false);
    const [notLabVisible, setNotLabVisible] = useState(false);
    const [uploadErrorVisible, setUploadErrorVisible] = useState(false);
    const [uploadErrorMessage, setUploadErrorMessage] = useState<string>('');
    const [rateLimitModalVisible, setRateLimitModalVisible] = useState(false);
    const [showUploadArea, setShowUploadArea] = useState(true);
    const [noPdfWarningVisible, setNoPdfWarningVisible] = useState(false);
    const t = useT();
    const locale = useLocaleStore(s => s.locale);
    const resetTrigger = useAnalizResetStore((s) => s.resetTrigger);
    const { w1px, h1px, fs1px } = useResponsive();

    const resetAnalizScreen = useCallback(() => {
        setPhase('idle');
        setFileName(null);
        setPickedFile(null);
        setItems([]);
        setRawItems([]);
        setAnalysis('');
        setShowUploadArea(true);
        setSelectErrorVisible(false);
        setUploadSuccessVisible(false);
        setNotLabVisible(false);
        setUploadErrorVisible(false);
        setRateLimitModalVisible(false);
    }, []);

    useEffect(() => {
        if (resetTrigger > 0) resetAnalizScreen();
    }, [resetTrigger, resetAnalizScreen]);

    useFocusEffect(
        useCallback(() => {
            useSessionStore.getState().touch();
            setItems([]);
            setRawItems([]);
            setAnalysis('');
            setShowUploadArea(true);
        }, []),
    );

    const styles = useMemo(
        () =>
            StyleSheet.create({
                contentView: {
                    flex: 1,
                    backgroundColor: colors.white,
                },
                header: {
                    paddingHorizontal: 8 * w1px,
                    paddingVertical: h1px * 10,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: colors.backgroundPurpleDark,
                    height: h1px * 90,
                    borderBottomRightRadius: fs1px * 14,
                    borderBottomLeftRadius: fs1px * 14,
                },
                headerTitle: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                title: { marginLeft: w1px * 3 },
                scrollView: {
                    flex: 1,
                },
                profileButton: {
                    backgroundColor: '#E5E7EB',
                    width: 40 * w1px,
                    height: 40 * w1px,
                    borderRadius: (40 * Math.min(w1px, h1px)) / 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                },

                cardContainer: {
                    flex: 1,
                    justifyContent: 'space-between',
                },
                cardView: {
                    flexDirection: 'column',
                    gap: h1px * 8,
                    flex: 1,
                },
                card: {
                    backgroundColor: 'white',
                    gap: h1px * 10,
                    flex: 1,
                },
                fileView: {
                    flexDirection: 'column',
                    gap: h1px * 4,
                },
                resultCard: {},
                uploadCard: {
                    backgroundColor: '#F9FAFB',
                    borderRadius: 16 * w1px,
                    borderWidth: 2,
                    borderColor: '#E5E7EB',
                    borderStyle: 'dashed',
                    paddingVertical: 14 * h1px,
                    paddingHorizontal: 20 * w1px,
                    marginTop: h1px * 8,
                },
                uploadCardTop: {
                    alignSelf: 'center',
                    marginBottom: 8 * h1px,
                },
                uploadCardContent: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10 * w1px,
                },
                uploadIconWrap: {
                    width: 56 * w1px,
                    height: 56 * h1px,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                uploadTextWrap: {
                    flex: 1,
                },
                settingsView: {
                    alignSelf: 'center',
                    width: iconSize.large * w1px,
                    height: iconSize.large * h1px,
                    resizeMode: 'contain',
                },
                buttonView: { paddingTop: h1px * 18, paddingBottom: h1px * 16 },
                detailModalView: {
                    flex: 1,
                    width: '100%',
                    paddingHorizontal: 4 * w1px,
                    paddingBottom: 8 * h1px,
                },
                pill: {
                    alignSelf: 'flex-start',
                    backgroundColor: colors.backgroundPurpleSoft,
                    borderRadius: 999,
                    paddingVertical: 6 * h1px,
                    paddingHorizontal: 14 * w1px,
                    marginBottom: 10 * h1px,
                },
                pillWarning: {
                    alignSelf: 'flex-start',
                    backgroundColor: '#FEE2E2',
                    borderRadius: 999,
                    paddingVertical: 6 * h1px,
                    paddingHorizontal: 14 * w1px,
                    marginBottom: 10 * h1px,
                },
                sectionGap: { height: 16 * h1px },
                bullet: { marginLeft: 10 * w1px, marginTop: 4 * h1px },
            }),
        [w1px, h1px, fs1px],
    );

    useEffect(() => {
        (async () => {
            const token = await getToken();
            if (!token) return;
            try {
                const me = await getProfile();
                if (me?.name) setDisplayName(me.name);
            } catch (e) {
                if (__DEV__) console.error('getProfile error:', e);
            }
        })();
    }, []);

    // PDF seç
    const handleSelectPdf = useCallback(async () => {
        try {
            const res = await DocumentPicker.pickSingle({
                type: [DocumentPicker.types.pdf],
                presentationStyle: 'fullScreen',
                copyTo: 'cachesDirectory',
            });
            setPickedFile(res);
            setFileName(res.name ?? 'document.pdf');
            setItems([]);
            setAnalysis('');
            setShowUploadArea(true);
        } catch (err: any) {
            if (DocumentPicker.isCancel(err)) {
                return;
            }
            setSelectErrorMessage(err?.message || 'PDF seçilemedi.');
            setSelectErrorVisible(true);
        }
    }, []);

    const handleSendPdf = useCallback(async () => {
        if (!pickedFile) {
            return;
        }
        setItems([]);
        setAnalysis('');
        setPhase('loading');
        useAnalysisLoadingStore.getState().setLoading(true);
        try {
            const form = new FormData();
            form.append('file', {
                uri: pickedFile.fileCopyUri ?? pickedFile.uri,
                name: pickedFile.name ?? 'document.pdf',
                type: pickedFile.type ?? 'application/pdf',
            } as any);
            form.append('locale', locale);

            const data = await uploadPdf(form);
            if (data.type === 'lab') {
                setItems(data.items || []);
                setRawItems(data.rawItems ?? data.items ?? []);
                setAnalysis(data.analysis || '');
                setPhase('result');
                setShowUploadArea(false);
                setUploadSuccessVisible(true);
            } else {
                setItems([]);
                setRawItems([]);
                setAnalysis('');
                setPhase('idle');
                setNotLabVisible(true);
            }
        } catch (err: any) {
            if (err?.isRateLimit) {
                setRateLimitModalVisible(true);
            } else {
                setUploadErrorMessage(err?.message || MESSAGES.uploadError);
                setUploadErrorVisible(true);
            }
            setItems([]);
            setRawItems([]);
            setAnalysis('');
            setPhase('idle');
        } finally {
            setPickedFile(null);
            setFileName(null);
            useAnalysisLoadingStore.getState().setLoading(false);
        }
    }, [pickedFile]);

    return (
        <View style={styles.contentView}>
            <Header title={displayName} />
            <PageLayout>
                <PageHeader title={t('tabs.analysis')} />
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
                    showsVerticalScrollIndicator={false}
                    bounces={true}>
                    <View style={styles.cardContainer}>
                        <View style={styles.cardView}>
                            <View style={styles.card}>
                                <PdfUploadSection
                                    phase={phase}
                                    showUploadArea={showUploadArea}
                                    items={items}
                                    pickedFile={pickedFile}
                                    fileName={fileName}
                                    onSelectPdf={handleSelectPdf}
                                    onSendPdf={handleSendPdf}
                                    onClearFile={() => {
                                        setPickedFile(null);
                                        setFileName(null);
                                    }}
                                    onShowUploadArea={() => {
                                        setItems([]);
                                        setRawItems([]);
                                        setAnalysis('');
                                        setShowUploadArea(true);
                                    }}
                                    trackButtonClick={trackButtonClick}
                                    t={t}
                                    styles={{
                                        card: styles.card,
                                        uploadCard: styles.uploadCard,
                                        uploadCardTop: styles.uploadCardTop,
                                        uploadCardContent: styles.uploadCardContent,
                                        uploadIconWrap: styles.uploadIconWrap,
                                        uploadTextWrap: styles.uploadTextWrap,
                                    }}
                                    w1px={w1px}
                                    h1px={h1px}
                                />
                                <ResultSection
                                    items={items}
                                    analysis={analysis}
                                    pickedFile={pickedFile}
                                    onNoPdfWarning={() => setNoPdfWarningVisible(true)}
                                    trackButtonClick={trackButtonClick}
                                    t={t}
                                    styles={{
                                        resultCard: styles.resultCard,
                                        detailModalView: styles.detailModalView,
                                        pill: styles.pill,
                                        pillWarning: styles.pillWarning,
                                        sectionGap: styles.sectionGap,
                                    }}
                                    w1px={w1px}
                                    h1px={h1px}
                                />
                            </View>
                        </View>
                    </View>

                    <PopupModal
                        visible={selectErrorVisible}
                        title={t('common.error')}
                        message={selectErrorMessage}
                        type="error"
                        rightButtonText={t('common.ok')}
                        onRightPress={() => setSelectErrorVisible(false)}
                    />

                    <PopupModal
                        visible={uploadSuccessVisible}
                        title={t('common.ok')}
                        message={t('home.success')}
                        type="success"
                        rightButtonText={t('common.close')}
                        onRightPress={() => setUploadSuccessVisible(false)}
                    />

                    <PopupModal
                        visible={notLabVisible}
                        title={t('common.warning')}
                        message={t('home.pleaseUploadResult')}
                        type="warning"
                        rightButtonText={t('common.understand')}
                        onRightPress={() => setNotLabVisible(false)}
                    />

                    <PopupModal
                        visible={rateLimitModalVisible}
                        title={t('home.rateLimitTitle')}
                        message={t('home.rateLimitMessage')}
                        type="warning"
                        rightButtonText={t('common.understand')}
                        onRightPress={() => setRateLimitModalVisible(false)}
                    />

                    <PopupModal
                        visible={uploadErrorVisible}
                        title={t('common.error')}
                        message={uploadErrorMessage || t('home.uploadError')}
                        type="error"
                        rightButtonText={t('common.ok')}
                        onRightPress={() => setUploadErrorVisible(false)}
                    />

                    <PopupModal
                        visible={noPdfWarningVisible}
                        title={t('common.warning')}
                        message={t('home.pleaseUploadResult')}
                        type="warning"
                        rightButtonText={t('common.ok')}
                        onRightPress={() => setNoPdfWarningVisible(false)}
                    />
                </ScrollView>
            </PageLayout>
        </View>
    );
};

export default Home;
