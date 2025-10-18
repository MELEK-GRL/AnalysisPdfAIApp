import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import DocumentPicker, {
    types,
    DocumentPickerResponse,
} from 'react-native-document-picker';

type Props = {
    onPicked?: (file: DocumentPickerResponse) => void;
    onUpload?: (file: DocumentPickerResponse) => Promise<void> | void;
    disableUploadButton?: boolean; // sadece seçme istiyorsan true yap
};

const Pdf: React.FC<Props> = ({ onPicked, onUpload, disableUploadButton }) => {
    const [selected, setSelected] = useState<DocumentPickerResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const pickPdf = async () => {
        try {
            const file = await DocumentPicker.pickSingle({
                type: [types.pdf],
                copyTo: 'cachesDirectory', // iOS/Android güvenli path
            });
            setSelected(file);
            onPicked?.(file);
        } catch (e: any) {
            if (DocumentPicker.isCancel(e)) {
                return;
            } // kullanıcı iptal etti
            console.warn('PDF seçilirken hata:', e);
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
                    <Text style={styles.meta}>
                        {(selected.size ?? 0) / 1024 < 1024
                            ? `${Math.round((selected.size ?? 0) / 1024)} KB`
                            : `${((selected.size ?? 0) / (1024 * 1024)).toFixed(2)} MB`}
                    </Text>
                </View>
            )}

            {!disableUploadButton && (
                <TouchableOpacity
                    style={[styles.uploadBtn, !selected && { opacity: 0.5 }]}
                    onPress={upload}
                    disabled={!selected || loading}>
                    {loading ? (
                        <ActivityIndicator />
                    ) : (
                        <Text style={styles.btnText}>Gönder</Text>
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
};

export default Pdf;

const styles = StyleSheet.create({
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
    name: { fontSize: 14, color: '#111', maxWidth: 280 },
    meta: { fontSize: 12, color: '#6b7280' },
});
