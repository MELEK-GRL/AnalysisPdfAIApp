import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Pressable,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import DocumentPicker, {
    type DocumentPickerResponse,
} from 'react-native-document-picker';
import { useResponsive } from '../../utils/deviceStore/device';
import { getProfile } from '../../server/api/User';
import { useNavigation } from '@react-navigation/native';
import { uploadPdf, LabItem } from '../../server/api/Lab';
import Chart from '../../components/Chart/Chart';
import { useAuthStore } from '../../store/useAuthStore';
import { useLocaleStore } from '../../store/useLocaleStore';
import { trackButtonClick } from '../../server/api/Analytics';
import { useScreenTime } from '../../utils/analytics/useScreenTime';
import Button from '../../components/Buttons/Button';
import LoadingModal from '../../components/Modals/LoadingModal';
import PopupModal from '../../components/Modals/PopupModal';
import PageLayout from '../../components/Layout/PageLayout';
import T from '../../components/Text/T';
import colors from '../../theme/colors';
import { fontSize } from '../../constants/typography';
import { iconSize } from '../../constants/icons';
import DetailModal from '../../components/Modals/DetailModal';
import Header from '../../components/Header/Header';

type Phase = 'idle' | 'loading' | 'result';

const Home: React.FC = () => {
    const nav = useNavigation<any>();
    useScreenTime('Home');
    const [phase, setPhase] = useState<Phase>('idle');
    const [fileName, setFileName] = useState<string | null>(null);
    const [commentModal, setCommentModal] = useState<boolean>(false);
    const [pickedFile, setPickedFile] = useState<DocumentPickerResponse | null>(
        null,
    );
    const user = useAuthStore(s => s.user);
    const [displayName, setDisplayName] = useState<string>(user?.name || '');
    const [items, setItems] = useState<LabItem[]>([]);
    const [analysis, setAnalysis] = useState<string>('');
    const [selectErrorVisible, setSelectErrorVisible] = useState(false);
    const [selectErrorMessage, setSelectErrorMessage] = useState<string>('');
    const [uploadSuccessVisible, setUploadSuccessVisible] = useState(false);
    const [notLabVisible, setNotLabVisible] = useState(false);
    const [uploadErrorVisible, setUploadErrorVisible] = useState(false);
    const [uploadErrorMessage, setUploadErrorMessage] = useState<string>('');
    const [rateLimitModalVisible, setRateLimitModalVisible] = useState(false);
    const t = useLocaleStore((s) => s.t);
    const { w1px, h1px, fs1px } = useResponsive();

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
                    paddingVertical: 24 * h1px,
                    paddingHorizontal: 20 * w1px,
                    marginTop: h1px * 16,
                },
                uploadCardTop: {
                    alignSelf: 'center',
                    marginBottom: 16 * h1px,
                },
                uploadCardContent: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 16 * w1px,
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
                    height: h1px * 600,
                    width: '100%',
                    paddingHorizontal: 12 * w1px,
                },
                pill: {
                    alignSelf: 'flex-start',
                    backgroundColor: '#F3F4F6',
                    borderRadius: 999,
                    paddingVertical: 4 * h1px,
                    paddingHorizontal: 10 * w1px,
                    marginBottom: 8 * h1px,
                },
                sectionGap: { height: 12 * h1px },
                bullet: { marginLeft: 10 * w1px, marginTop: 4 * h1px },
            }),
        [w1px, h1px, fs1px],
    );

    useEffect(() => {
        (async () => {
            try {
                const me = await getProfile();
                if (me?.name) {
                    setDisplayName(me.name);
                }
            } catch (e) {
                if (__DEV__) {
                    console.error('getProfile error:', e);
                }
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
        setPhase('loading');
        try {
            const form = new FormData();
            form.append('file', {
                uri: pickedFile.fileCopyUri ?? pickedFile.uri,
                name: pickedFile.name ?? 'document.pdf',
                type: pickedFile.type ?? 'application/pdf',
            } as any);

            const data = await uploadPdf(form);
            if (data.type === 'lab') {
                setItems(data.items || []);
                setAnalysis(data.analysis || '');
                setPhase('result');
                setUploadSuccessVisible(true);
            } else {
                setItems([]);
                setAnalysis('');
                setPhase('idle');
                setNotLabVisible(true);
            }
        } catch (err: any) {
            if (err?.isRateLimit) {
                setRateLimitModalVisible(true);
            } else {
                setUploadErrorMessage(err?.message || 'PDF yüklenemedi.');
                setUploadErrorVisible(true);
            }
            setPhase('idle');
        } finally {
            setPickedFile(null);
            setFileName(null);
        }
    }, [pickedFile]);

    return (
        <View style={styles.contentView}>
            <Header title={displayName} />
            <PageLayout>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
                    showsVerticalScrollIndicator={false}
                    bounces={true}>
                    <View style={styles.cardContainer}>
                        <View style={styles.cardView}>
                            <View style={styles.card}>
                                <TouchableOpacity
                                    onPress={() => {
                                        trackButtonClick('select_pdf', { screen: 'Home' });
                                        handleSelectPdf();
                                    }}
                                    disabled={phase === 'loading'}
                                    activeOpacity={0.8}
                                    style={styles.uploadCard}>
                                    <T
                                        size={fontSize.body}
                                        color="#6B7280"
                                        style={styles.uploadCardTop}>
                                        {t('home.dragOrSelect')}
                                    </T>
                                    <View style={styles.uploadCardContent}>
                                        <View style={styles.uploadIconWrap}>
                                            <Ionicons
                                                name="cloud-upload"
                                                size={iconSize.xxl}
                                                color={colors.backgroundPurple}
                                            />
                                        </View>
                                        <View style={styles.uploadTextWrap}>
                                            <T
                                                size={fontSize.subtitle}
                                                weight="700"
                                                color="#111827"
                                                style={{ marginBottom: 4 }}>
                                                {t('home.uploadPdf')}
                                            </T>
                                            <T size={fontSize.bodySmall} color="#9CA3AF">
                                                {t('home.pdfHint')}
                                            </T>
                                        </View>
                                    </View>
                                </TouchableOpacity>

                                <Button
                                    buttonText={t('home.send')}
                                    onPress={() => {
                                        trackButtonClick('send_pdf', { screen: 'Home' });
                                        handleSendPdf();
                                    }}
                                    disabled={!pickedFile || phase === 'loading'}
                                    width={h1px * 200}
                                />

                                <View style={styles.fileView}>
                                    {fileName && (
                                        <T size={fontSize.subtitle} color="#232426ff">
                                            {t('home.selected')}: {fileName}
                                        </T>
                                    )}
                                    <T size={fontSize.body} color="#232426ff">
                                        {t('home.pdfHint')}
                                    </T>
                                </View>

                                <View style={styles.resultCard}>
                                    <T
                                        size={fontSize.title}
                                        weight="700"
                                        color={colors.backgroundPurpleDark}
                                        style={{ marginBottom: 8 * h1px }}>
                                        {t('home.analysisResult')}
                                    </T>

                                    <View>
                                        <Chart items={items} />
                                    </View>
                                </View>
                            </View>
                        </View>

                        {items.length > 0 && (
                            <View style={styles.buttonView}>
                                <Button
                                    buttonText={t('home.interpretButton')}
                                    onPress={() => {
                                        trackButtonClick('interpret_result', { screen: 'Home' });
                                        setCommentModal(true);
                                    }}
                                    width="100%"
                                />
                            </View>
                        )}
                    </View>

                    {/* ANALİZ MODALI */}
                    <DetailModal
                        visible={commentModal}
                        title={t('home.analysisTitle')}
                        rightButtonText={t('common.close')}
                        onRightPress={() => setCommentModal(false)}>
                        <ScrollView
                            style={styles.detailModalView}
                            showsVerticalScrollIndicator={false}
                            showsHorizontalScrollIndicator={false}>
                            <Pressable>
                                <View>
                                    <View style={styles.pill}>
                                        <T size={fontSize.label} weight="700" color="#111827">
                                            ANALİZ
                                        </T>
                                    </View>

                                    {analysis ? (
                                        analysis.split(/\n+/).map((line, idx) => (
                                            <T
                                                key={idx}
                                                size={fontSize.body}
                                                color="#111827"
                                                style={{ marginBottom: 6 * h1px }}>
                                                {line}
                                            </T>
                                        ))
                                    ) : (
                                        <>
                                            <T size={fontSize.body} color="#111827">
                                                {t('home.noAnalysis')}
                                            </T>
                                        </>
                                    )}

                                    <View style={styles.sectionGap} />
                                    <View style={styles.pill}>
                                        <T size={fontSize.label} weight="700" color="#111827">
                                            {t('home.suggestions')}
                                        </T>
                                    </View>
                                    <T size={fontSize.body} color="#111827">
                                        {t('home.suggestionsText')}
                                    </T>
                                    <View style={styles.sectionGap} />
                                    <View style={[styles.pill, { backgroundColor: '#FEF2F2' }]}>
                                        <T size={fontSize.label} weight="700" color="#991B1B">
                                            {t('home.importantWarning')}
                                        </T>
                                    </View>
                                    <T size={fontSize.body} color="#991B1B">
                                        {t('home.disclaimer')}
                                    </T>
                                </View>
                            </Pressable>
                        </ScrollView>
                    </DetailModal>

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
                        message={t('home.notLab')}
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
                </ScrollView>
            </PageLayout>

            <LoadingModal visible={phase === 'loading'} />
        </View>
    );
};

export default Home;
