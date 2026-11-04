import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';

import {
    pickPdfDocument,
    isPdfPickCanceled,
    type PickedPdfFile,
} from '../../utils/pickPdfDocument';
import { useResponsive } from '../../utils/deviceStore/device';
import { getProfile } from '../../server/api/User';
import { getToken } from '../../server/apiFetcher';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { uploadPdf, LabItem } from '../../server/api/Lab';
import { useAuthStore } from '../../store/useAuthStore';
import { useT, useLocaleStore } from '../../store/useLocaleStore';
import { useAnalizResetStore } from '../../store/useAnalizResetStore';
import { useAnalysisLoadingStore } from '../../store/useAnalysisLoadingStore';
import { useQuotaStore } from '../../store/useQuotaStore';
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
import { TEST_REWARDED_UNIT_ID } from '../../constants/limits';
import { showRewardedAdForCredit } from '../../utils/ads/rewardedAd';
import PdfUploadSection from './PdfUploadSection';
import ResultSection from './ResultSection';

type Phase = 'idle' | 'loading' | 'result';

const Home: React.FC = () => {
    const nav = useNavigation<any>();
    useScreenTime('Home');
    const [phase, setPhase] = useState<Phase>('idle');
    const [fileName, setFileName] = useState<string | null>(null);
    const [pickedFile, setPickedFile] = useState<PickedPdfFile | null>(null);
    const user = useAuthStore(s => s.user);
    const [displayName, setDisplayName] = useState<string>(user?.name || '');

    useEffect(() => {
        if (user?.name) {
            setDisplayName(user.name);
        }
    }, [user?.name]);
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
    /** Sunucu ADS_ENABLED – client rebuild gerekmez */
    const [rateLimitAdsOffer, setRateLimitAdsOffer] = useState(false);
    const [rewardedUnitId, setRewardedUnitId] = useState(TEST_REWARDED_UNIT_ID);
    const [rateLimitMessage, setRateLimitMessage] = useState('');
    const [rateLimitCreditGranted, setRateLimitCreditGranted] = useState(false);
    const [adWatching, setAdWatching] = useState(false);
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
        setRateLimitAdsOffer(false);
        setRateLimitCreditGranted(false);
        setRewardedUnitId(TEST_REWARDED_UNIT_ID);
        setAdWatching(false);
    }, []);

    useEffect(() => {
        if (resetTrigger > 0) resetAnalizScreen();
    }, [resetTrigger, resetAnalizScreen]);

    useFocusEffect(
        useCallback(() => {
            useSessionStore.getState().touch();
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
                    width: 48 * w1px,
                    height: 48 * h1px,
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
                if (me?.name) {
                    setDisplayName(me.name);
                    const auth = useAuthStore.getState();
                    if (!auth.user?.name || auth.user.name !== me.name) {
                        auth.setUserAndToken(
                            {
                                _id: me._id,
                                name: me.name,
                                email: me.email,
                            },
                            token,
                        );
                    }
                }
            } catch (e) {
                if (__DEV__) console.error('getProfile error:', e);
            }
        })();
    }, []);

    // PDF seç (oturum hold pickPdfDocument içinde)
    const handleSelectPdf = useCallback(async () => {
        try {
            const res = await pickPdfDocument();
            setPickedFile(res);
            setFileName(res.name ?? 'document.pdf');
            setItems([]);
            setAnalysis('');
            setShowUploadArea(true);
        } catch (err: any) {
            if (isPdfPickCanceled(err)) {
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
        // Overlay boyansın; aksi halde loading çoğu zaman sonuç popup’ından hemen önce flaşlar
        await new Promise<void>(resolve => {
            requestAnimationFrame(() => setTimeout(resolve, 32));
        });
        try {
            const form = new FormData();
            const rawName = pickedFile.name ?? 'document.pdf';
            const safeName = rawName.replace(/[()\s]+/g, '_').replace(/_+/g, '_') || 'document.pdf';
            const nameWithPdf = safeName.toLowerCase().endsWith('.pdf') ? safeName : `${safeName}.pdf`;
            // keepLocalCopy sonrası yerel file:// URI kullan (content:// upload'da auth/body bozulabiliyor)
            const fileUri = pickedFile.fileCopyUri || pickedFile.uri;
            if (!fileUri) {
                throw new Error('PDF dosya yolu alınamadı. Lütfen tekrar seçin.');
            }
            form.append('file', {
                uri: fileUri,
                name: nameWithPdf,
                type: 'application/pdf',
            } as any);
            form.append('locale', locale);

            const data = await uploadPdf(form);
            void useQuotaStore.getState().refresh();
            // Loading UI’yi tamamen kapat, sonra sonuç popup’ı (flaş yok)
            useAnalysisLoadingStore.getState().setLoading(false);
            await new Promise<void>(resolve => {
                requestAnimationFrame(() => setTimeout(resolve, 40));
            });
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
            useAnalysisLoadingStore.getState().setLoading(false);
            await new Promise<void>(resolve => {
                requestAnimationFrame(() => setTimeout(resolve, 40));
            });
            if (err?.isRateLimit) {
                void useQuotaStore.getState().refresh();
                const offerAds = err?.adsEnabled === true;
                setRateLimitAdsOffer(offerAds);
                setRateLimitCreditGranted(false);
                if (offerAds && err?.rewardedUnitId) {
                    setRewardedUnitId(String(err.rewardedUnitId));
                }
                setRateLimitMessage(
                    offerAds
                        ? t('home.rateLimitMessageWithAds')
                        : t('home.rateLimitMessage'),
                );
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
    }, [pickedFile, locale, t]);

    const closeRateLimitModal = useCallback(() => {
        setRateLimitModalVisible(false);
        setRateLimitAdsOffer(false);
        setRateLimitCreditGranted(false);
        setAdWatching(false);
    }, []);

    const handleWatchAd = useCallback(async () => {
        if (adWatching || !rateLimitAdsOffer) return;
        setAdWatching(true);
        setRateLimitCreditGranted(false);
        setRateLimitMessage(t('home.adLoading'));
        // LoadingModal (root) hemen açılsın, popup kapansın, reklam yüklensin
        const loadingStore = useAnalysisLoadingStore.getState();
        loadingStore.setAdUiLocked(true);
        loadingStore.acquireHold();
        useSessionStore.getState().touch();
        setRateLimitModalVisible(false);
        try {
            void trackButtonClick('watch_rewarded_ad', 'Home');
            const maxAds = 2;
            for (let i = 0; i < maxAds; i++) {
                setRateLimitMessage(
                    i === 0
                        ? t('home.adLoading')
                        : t('home.adProgress').replace(
                              '{{pending}}',
                              String(i),
                          ),
                );
                const result = await showRewardedAdForCredit(rewardedUnitId);
                // Reklam kapandı — kilit hâlâ açık kalsın (2. reklama / sonuca kadar)
                useAnalysisLoadingStore.getState().setAdUiLocked(true);
                useAnalysisLoadingStore.getState().remountAdLock();
                if (!result) {
                    setRateLimitMessage(t('home.adFailed'));
                    setRateLimitModalVisible(true);
                    return;
                }
                if (result.creditGranted) {
                    setRateLimitAdsOffer(false);
                    setRateLimitCreditGranted(true);
                    setRateLimitMessage(t('home.adCreditGranted'));
                    setRateLimitModalVisible(true);
                    void useQuotaStore.getState().refresh();
                    return;
                }
            }
            setRateLimitModalVisible(true);
        } finally {
            useSessionStore.getState().touch();
            const store = useAnalysisLoadingStore.getState();
            store.releaseHold();
            store.setAdUiLocked(false);
            setAdWatching(false);
        }
    }, [adWatching, rateLimitAdsOffer, rewardedUnitId, t]);

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
                        title={
                            rateLimitCreditGranted
                                ? t('home.adCreditTitle')
                                : t('home.rateLimitTitle')
                        }
                        message={rateLimitMessage || t('home.rateLimitMessage')}
                        type={rateLimitCreditGranted ? 'success' : 'warning'}
                        leftButtonText={
                            rateLimitAdsOffer ? t('common.close') : undefined
                        }
                        onLeftPress={
                            rateLimitAdsOffer ? closeRateLimitModal : undefined
                        }
                        rightButtonText={
                            rateLimitAdsOffer
                                ? adWatching
                                    ? t('home.adLoading')
                                    : t('home.watchAd')
                                : t('common.understand')
                        }
                        onRightPress={() => {
                            if (rateLimitAdsOffer) {
                                void handleWatchAd();
                            } else {
                                closeRateLimitModal();
                            }
                        }}
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
