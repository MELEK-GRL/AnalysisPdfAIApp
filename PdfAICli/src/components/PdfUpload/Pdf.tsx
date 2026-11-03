import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import {
    pickPdfDocument,
    isPdfPickCanceled,
    type PickedPdfFile,
} from '../../utils/pickPdfDocument';
import { useTypography } from '../../theme/useTypography';

type Props = {
    onPicked?: (file: PickedPdfFile) => void;
    onUpload?: (file: PickedPdfFile) => Promise<void> | void;
    disableUploadButton?: boolean;
};

const Pdf: React.FC<Props> = ({ onPicked, onUpload, disableUploadButton }) => {
    const [selected, setSelected] = useState<PickedPdfFile | null>(null);
    const [loading, setLoading] = useState(false);
    const { fontSize: scaledFontSize } = useTypography();
    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: { gap: 12, alignItems: 'center' },
                pickBtn: {
                    backgroundColor: '#2563eb',
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                },
                uploadBtn: {
                    backgroundColor: '#16a34a',
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                },
                btnText: { color: '#fff', fontWeight: '600' },
                info: { alignItems: 'center', maxWidth: '90%' },
                name: { fontSize: scaledFontSize.body, color: '#111', maxWidth: 280 },
                meta: { fontSize: scaledFontSize.label, color: '#6b7280' },
            }),
        [scaledFontSize.body, scaledFontSize.label],
    );

    const pickPdf = async () => {
        try {
            const file = await pickPdfDocument();
            setSelected(file);
            onPicked?.(file);
        } catch (e: any) {
            if (isPdfPickCanceled(e)) {
                return;
            }
            if (__DEV__) {
                console.warn('PDF seçilirken hata:', e);
            }
        }
    };

    const upload = async () => {
        if (!selected || !onUpload) {
            return;
        }
        try {
            setLoading(true);
            await onUpload(selected);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.pickBtn} onPress={pickPdf}>
                <Text style={styles.btnText}>PDF Seç</Text>
            </TouchableOpacity>

            {selected && (
                <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>
                        {selected.name}
                    </Text>
                    {selected.size != null && (
                        <Text style={styles.meta}>
                            {(selected.size / 1024).toFixed(1)} KB
                        </Text>
                    )}
                </View>
            )}

            {onUpload && (
                <TouchableOpacity
                    style={[
                        styles.uploadBtn,
                        (!selected || disableUploadButton) && { opacity: 0.5 },
                    ]}
                    disabled={!selected || !!disableUploadButton || loading}
                    onPress={upload}>
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.btnText}>Yükle</Text>
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
};

export default Pdf;
