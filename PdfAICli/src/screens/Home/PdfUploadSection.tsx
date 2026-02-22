/**
 * Home ekranı – PDF seçim ve yükleme alanı (upload kartı, gönder butonu, seçili dosya satırı).
 */
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { type DocumentPickerResponse } from 'react-native-document-picker';
import T from '../../components/Text/T';
import Button from '../../components/Buttons/Button';
import colors from '../../theme/colors';
import { fontSize } from '../../constants/typography';
import { iconSize } from '../../constants/icons';
import type { LabItem } from '../../server/api/Lab';

export type PdfUploadSectionProps = {
    phase: 'idle' | 'loading' | 'result';
    showUploadArea: boolean;
    items: LabItem[];
    pickedFile: DocumentPickerResponse | null;
    fileName: string | null;
    onSelectPdf: () => void;
    onSendPdf: () => void;
    onClearFile: () => void;
    onShowUploadArea: () => void;
    trackButtonClick: (id: string, opts?: { screen?: string }) => void;
    t: (key: string) => string;
    styles: {
        card: object;
        uploadCard: object;
        uploadCardTop: object;
        uploadCardContent: object;
        uploadIconWrap: object;
        uploadTextWrap: object;
    };
    w1px: number;
    h1px: number;
};

const PdfUploadSection: React.FC<PdfUploadSectionProps> = ({
    phase,
    showUploadArea,
    items,
    pickedFile,
    fileName,
    onSelectPdf,
    onSendPdf,
    onClearFile,
    onShowUploadArea,
    trackButtonClick,
    t,
    styles,
    w1px,
    h1px,
}) => {
    const showUpload = items.length === 0 || showUploadArea;

    if (!showUpload) {
        return (
            <TouchableOpacity
                onPress={() => {
                    trackButtonClick('show_upload_area', { screen: 'Home' });
                    onShowUploadArea();
                }}
                activeOpacity={0.7}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignSelf: 'center',
                    gap: 8 * w1px,
                    paddingVertical: 12 * h1px,
                    paddingHorizontal: 16 * w1px,
                    backgroundColor: colors.backgroundPurpleSoft,
                    borderRadius: 12 * w1px,
                    borderWidth: 1,
                    borderColor: colors.backgroundPurple + '40',
                    borderStyle: 'dashed',
                    marginTop: 12 * h1px,
                    marginBottom: 8 * h1px,
                }}>
                <Ionicons name="cloud-upload-outline" size={iconSize.medium} color={colors.backgroundPurple} />
                <T size={fontSize.body} weight="600" color={colors.backgroundPurple}>
                    {t('home.newPdfUpload')}
                </T>
                <Ionicons name="chevron-down" size={iconSize.small} color={colors.backgroundPurple} />
            </TouchableOpacity>
        );
    }

    return (
        <>
            <TouchableOpacity
                onPress={() => {
                    trackButtonClick('select_pdf', { screen: 'Home' });
                    onShowUploadArea();
                    onSelectPdf();
                }}
                disabled={phase === 'loading'}
                activeOpacity={0.8}
                style={styles.uploadCard}>
                <T size={fontSize.bodySmall} color="#6B7280" style={styles.uploadCardTop}>
                    {t('home.dragOrSelect')}
                </T>
                <View style={styles.uploadCardContent}>
                    <View style={styles.uploadIconWrap}>
                        <Ionicons name="cloud-upload" size={36} color={colors.backgroundPurple} />
                    </View>
                    <View style={styles.uploadTextWrap}>
                        <T size={fontSize.body} weight="700" color="#111827" style={{ marginBottom: 2 }}>
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
                    onSendPdf();
                }}
                disabled={!pickedFile || phase === 'loading'}
                width={h1px * 200}
            />

            {fileName && (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10 * w1px,
                        backgroundColor: colors.backgroundPurpleSoft,
                        paddingVertical: 10 * h1px,
                        paddingHorizontal: 14 * w1px,
                        borderRadius: 12 * w1px,
                        borderWidth: 1,
                        borderColor: colors.backgroundPurple + '25',
                        marginTop: 8 * h1px,
                    }}>
                    <View
                        style={{
                            width: 36 * w1px,
                            height: 36 * w1px,
                            borderRadius: 8,
                            backgroundColor: colors.white,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                        <Ionicons name="document-text" size={iconSize.medium} color={colors.backgroundPurple} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <T size={fontSize.bodySmall} color="#6B7280" numberOfLines={1}>
                            {t('home.selected')}
                        </T>
                        <T size={fontSize.subtitle} weight="600" color="#111827" numberOfLines={1} style={{ marginTop: 2 }}>
                            {fileName}
                        </T>
                    </View>
                    <TouchableOpacity
                        onPress={onClearFile}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={{ padding: 4 }}>
                        <Ionicons name="trash-outline" size={iconSize.medium} color="#DC2626" />
                    </TouchableOpacity>
                    <Ionicons name="checkmark-circle" size={iconSize.medium} color={colors.backgroundPurple} />
                </View>
            )}
        </>
    );
};

export default PdfUploadSection;
