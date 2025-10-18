import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    Pressable,
} from 'react-native';

import DocumentPicker, {
    type DocumentPickerResponse,
} from 'react-native-document-picker';
import { useResponsive } from '../../utils/deviceStore/device';
import { getProfile } from '../../server/api/User';
import { useNavigation } from '@react-navigation/native';
import { uploadPdf, LabItem } from '../../server/api/Lab';
import Chart from '../../components/Chart/Chart';
import { useAuthStore } from '../../store/useAuthStore';
import Button from '../../components/Buttons/Button';
import LoadingModal from '../../components/Modals/LoadingModal';
import CenterModal from '../../components/Modals/CenterModal';
import PageLayout from '../../components/Layout/PageLayout';
import T from '../../components/Text/T';
import colors from '../../theme/colors';
import DetailModal from '../../components/Modals/DetailModal';
import Header from '../../components/Header/Header';
import GradientLayout from '../../components/Layout/GradientLayout';

type Phase = 'idle' | 'loading' | 'result';

const Home: React.FC = () => {
    const nav = useNavigation<any>();

    // UI/state
    const [phase, setPhase] = useState<Phase>('idle');
    const [fileName, setFileName] = useState<string | null>(null);
    const [commentModal, setCommentModal] = useState<boolean>(false);
    const [pickedFile, setPickedFile] = useState<DocumentPickerResponse | null>(
        null,
    );
    const user = useAuthStore(s => s.user);
    const [displayName, setDisplayName] = useState<string>(user?.name || '');
    const [items, setItems] = useState<LabItem[]>([]);
    const [analysis, setAnalysis] = useState<string>(''); // ⬅️ analiz metni
    console.log('--->analysis', JSON.stringify(analysis, null, 2));

    // ——— CenterModal state’leri (her Alert için ayrı) ———
    const [selectErrorVisible, setSelectErrorVisible] = useState(false);
    const [selectErrorMessage, setSelectErrorMessage] = useState<string>('');

    const [uploadSuccessVisible, setUploadSuccessVisible] = useState(false);

    const [notLabVisible, setNotLabVisible] = useState(false);

    const [uploadErrorVisible, setUploadErrorVisible] = useState(false);
    const [uploadErrorMessage, setUploadErrorMessage] = useState<string>('');

    // responsive helpers
    const { w1px, h1px, fs1px } = useResponsive();

    // styles (memoize, performans)
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
                    backgroundColor: colors.backgroundPrupleDark,
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
                pdfView: {
                    alignItems: 'center',
                    marginTop: h1px * 16,
                },
                imageView: {
                    alignSelf: 'center',
                    width: 80 * w1px,
                    height: 80 * h1px,
                    resizeMode: 'contain',
                },
                settingsView: {
                    alignSelf: 'center',
                    width: 30 * w1px,
                    height: 30 * h1px,
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
                    backgroundColor: '#ECFDF5',
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
                console.error('error:', e);
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
                setAnalysis(data.analysis || ''); // ⬅️ analiz metnini al
                setPhase('result');
                setUploadSuccessVisible(true);
            } else {
                setItems([]);
                setAnalysis('');
                setPhase('idle');
                setNotLabVisible(true);
            }
        } catch (err: any) {
            setUploadErrorMessage(err?.message || 'PDF yüklenemedi.');
            setUploadErrorVisible(true);
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
                <View style={styles.scrollView}>
                    <View style={styles.cardContainer}>
                        <View style={styles.cardView}>
                            <View style={styles.card}>
                                <TouchableOpacity
                                    onPress={handleSelectPdf}
                                    disabled={phase === 'loading'}
                                    activeOpacity={0.8}
                                    style={styles.pdfView}>
                                    <Image
                                        source={require('../../assets/icons/pdf.png')}
                                        style={styles.imageView}
                                    />
                                    <T size={14} weight="800" color={colors.backgroundPruple}>
                                        Tahlil Raporunu Yükle
                                    </T>
                                </TouchableOpacity>

                                <Button
                                    buttonText="Gönder"
                                    onPress={handleSendPdf}
                                    disabled={!pickedFile || phase === 'loading'}
                                    width={h1px * 200}
                                />

                                <View style={styles.fileView}>
                                    {fileName && (
                                        <T size={16} color="#232426ff">
                                            Seçilen: {fileName}
                                        </T>
                                    )}
                                    <T size={14} color="#232426ff">
                                        Sadece PDF kabul edilir. Max ~10MB önerilir.
                                    </T>
                                </View>

                                <View style={styles.resultCard}>
                                    <T
                                        size={18}
                                        weight="700"
                                        color={colors.backgroundPrupleDark}
                                        style={{ marginBottom: 8 * h1px }}>
                                        Analiz Sonucu
                                    </T>

                                    <View style={{ height: '78%' }}>
                                        <Chart items={items} />
                                    </View>
                                </View>
                            </View>
                        </View>

                        {items.length > 0 && (
                            <View style={styles.buttonView}>
                                <Button
                                    buttonText="Tahlil Sonuçlarımı Yorumla"
                                    onPress={() => setCommentModal(true)}
                                    width={h1px * 240}
                                />
                            </View>
                        )}
                    </View>

                    {/* ANALİZ MODALI */}
                    <DetailModal
                        visible={commentModal}
                        title="Tahlil Sonuçları Analizi"
                        rightButtonText="Kapat"
                        onRightPress={() => setCommentModal(false)}>
                        <ScrollView style={styles.detailModalView}>
                            <Pressable>
                                <View>
                                    {/* Başlık rozeti */}
                                    <View style={styles.pill}>
                                        <T size={12} weight="700" color="#065F46">
                                            ANALİZ
                                        </T>
                                    </View>

                                    {analysis ? (
                                        // Tek parça metin geldiyse satırlara bölerek gösterelim
                                        analysis.split(/\n+/).map((line, idx) => (
                                            <T
                                                key={idx}
                                                size={14}
                                                color="#111827"
                                                style={{ marginBottom: 6 * h1px }}>
                                                {line}
                                            </T>
                                        ))
                                    ) : (
                                        <>
                                            <T size={14} color="#111827">
                                                Analiz metni bulunamadı. Lütfen tahlil değerlerinizi
                                                tekrar yüklemeyi deneyin.
                                            </T>
                                        </>
                                    )}

                                    <View style={styles.sectionGap} />

                                    {/* ÖNERİLER başlığı (analiz içinde yoksa yine de bir alan göster) */}
                                    <View style={styles.pill}>
                                        <T size={12} weight="700" color="#065F46">
                                            ÖNERİLER
                                        </T>
                                    </View>
                                    <T size={14} color="#111827">
                                        Günlük yaşam ve hidrasyon, düzenli uyku ve dengeli beslenme
                                        çoğu parametre için destekleyicidir. Spesifik bir ilaç veya
                                        takviye önerisi **doktor kontrolü** dışında yapılmamalıdır.
                                    </T>

                                    <View style={styles.sectionGap} />

                                    {/* UYARI */}
                                    <View style={[styles.pill, { backgroundColor: '#FEF2F2' }]}>
                                        <T size={12} weight="700" color="#991B1B">
                                            ÖNEMLİ UYARI
                                        </T>
                                    </View>
                                    <T size={14} color="#991B1B">
                                        Bu içerik bilgilendirme amaçlıdır ve tıbbi tavsiye değildir.
                                        Nihai yorum ve tedavi planı için lütfen **doktorunuza
                                        danışın**.
                                    </T>
                                </View>
                            </Pressable>
                        </ScrollView>
                    </DetailModal>

                    <CenterModal
                        visible={selectErrorVisible}
                        title="Hata"
                        message={selectErrorMessage}
                        rightButtonText="Tamam"
                        onRightPress={() => setSelectErrorVisible(false)}
                    />

                    <CenterModal
                        visible={uploadSuccessVisible}
                        title="Tamam"
                        message="Tahlil verileri çıkarıldı."
                        rightButtonText="Kapat"
                        onRightPress={() => setUploadSuccessVisible(false)}
                    />

                    <CenterModal
                        visible={notLabVisible}
                        title="Uyarı"
                        message="Bu PDF tahlil raporu değil gibi görünüyor."
                        rightButtonText="Anladım"
                        onRightPress={() => setNotLabVisible(false)}
                    />

                    <CenterModal
                        visible={uploadErrorVisible}
                        title="Hata"
                        message={uploadErrorMessage || 'PDF yüklenemedi.'}
                        rightButtonText="Tamam"
                        onRightPress={() => setUploadErrorVisible(false)}
                    />
                </View>
            </PageLayout>

            <LoadingModal visible={phase === 'loading'} />
        </View>
    );
};

export default Home;
