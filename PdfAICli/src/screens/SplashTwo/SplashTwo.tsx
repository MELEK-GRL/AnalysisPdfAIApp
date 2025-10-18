// src/screens/SplashTwo/index.tsx
import React, { useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Button from '../../components/Buttons/Button';
import { useResponsive } from '../../utils/deviceStore/device';
import T from '../../components/Text/T';
import { api } from '../../server/apiFetcher';
import CenterModal from '../../components/Modals/CenterModal';
import TERMS_ITEMS from '../../utils/contractArticles/Articles.json';
import colors from '../../theme/colors';
import GradientLayout from '../../components/Layout/GradientLayout';
console.log('--->api', api);
const TERMS_VERSION = 'v1.0.0';

async function getInstallationId(): Promise<string> {
    const KEY = 'installation_id';
    let id = await AsyncStorage.getItem(KEY);
    if (!id) {
        id = `inst_${Date.now().toString(36)}_${Math.random()
            .toString(36)
            .slice(2, 10)}`;
        await AsyncStorage.setItem(KEY, id);
    }
    return id;
}

const SplashTwo: React.FC = () => {
    const navigation = useNavigation<any>();
    const { w1px, h1px, fs1px } = useResponsive();

    const [accepted, setAccepted] = useState(false);
    const [loading, setLoading] = useState(false);

    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    const openModal = (message: string) => {
        setModalMessage(message);
        setModalVisible(true);
    };
    const closeModal = () => setModalVisible(false);

    const renderChild = useCallback(
        (child: { text: string }, cIdx: number) => (
            <View
                key={`c-${cIdx}`}
                style={{ marginTop: 4 * h1px, paddingLeft: 16 * w1px }}>
                <T size={13 * fs1px} color="#4B5563">
                    • {child.text}
                </T>
            </View>
        ),
        [w1px, h1px, fs1px],
    );

    const renderTermItem = useCallback(
        (item: any, idx: number) => (
            <View key={idx} style={{ marginTop: 8 * h1px }}>
                <T size={15 * fs1px} color="#374151">
                    {idx + 1}. {item.text}
                </T>
                {item.children?.length ? item.children.map(renderChild) : null}
            </View>
        ),
        [h1px, fs1px, renderChild],
    );

    const handleContinue = async () => {
        console.log('--->handleContinue girdi');
        if (!accepted) {
            openModal('Devam edebilmek için Kullanıcı Sözleşmesini onaylamalısınız.');
            return;
        }
        try {
            setLoading(true);

            const installationId = await getInstallationId();
            const device = { platform: Platform.OS };

            const { data } = await api.post('/consents/accept', {
                installationId,
                termsVersion: TERMS_VERSION,
                method: 'checkbox',
                device,
            });

            if (data?.id) {
                await AsyncStorage.setItem('last_consent_id', String(data.id));
            }
            console.log('--->data', JSON.stringify(data, null, 2));
            navigation.navigate('Login');
        } catch (e: any) {
            console.error('CONSENT ERR:', e?.message || e);
            openModal(
                'Sözleşme onayı kaydedilemedi. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.',
            );
        } finally {
            setLoading(false);
        }
    };

    const s = styles(w1px, h1px, fs1px);

    return (
        <GradientLayout>
            <View style={s.container}>
                {/* Üst logo */}
                <View style={s.logoContent}>
                    <View style={s.logoImg}>
                        <Image
                            source={require('../../assets/icons/test8.png')}
                            style={s.imageView}
                            accessible
                            accessibilityLabel="Tahlil Analizi Logo"
                        />
                    </View>
                </View>

                {/* Kart + içerik */}
                <View style={s.containerView}>
                    <View style={s.scrollContainer}>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            style={s.scrollView}>
                            <T
                                size={18 * fs1px}
                                weight="700"
                                color="#111827"
                                style={{ marginBottom: 8 * h1px }}>
                                Kullanıcı Sözleşmesi
                            </T>

                            <T size={15 * fs1px} color="#374151">
                                Bu uygulamayı kullanarak aşağıdaki koşulları kabul etmiş
                                sayılırsınız:
                            </T>

                            <View style={{ marginTop: 6 * h1px }}>
                                {TERMS_ITEMS.map(renderTermItem)}
                            </View>
                        </ScrollView>
                    </View>

                    {/* Checkbox */}
                    <TouchableOpacity
                        onPress={() => setAccepted(!accepted)}
                        activeOpacity={0.8}
                        style={s.checkboxRow}>
                        <View
                            style={[
                                s.checkbox,
                                { backgroundColor: accepted ? colors.backgroundPruple : '#fff' },
                            ]}
                        />
                        <T
                            size={14 * fs1px}
                            color="#111"
                            style={{ marginLeft: 8 * w1px, flex: 1 }}>
                            Sözleşmeyi okudum ve kabul ediyorum.
                        </T>
                    </TouchableOpacity>

                    <Button
                        buttonText={loading ? 'Kaydediliyor…' : 'Devam Et'}
                        onPress={handleContinue}
                        width={h1px * 180}
                        disabled={!accepted || loading}
                        style={{
                            shadowColor: '#5B21B6',
                            shadowOpacity: 0.12,
                            shadowRadius: 10 * w1px,
                            shadowOffset: { width: 0, height: 6 },
                            elevation: 3,
                        }}
                        accessibilityLabel="Devam Et"
                        accessibilityHint="Giriş ekranına geç"
                    />

                    <CenterModal
                        visible={modalVisible}
                        title="Bilgi"
                        message={modalMessage}
                        rightButtonText="Tamam"
                        onRightPress={closeModal}
                    />
                </View>
            </View>
        </GradientLayout>
    );
};

export default SplashTwo;

const styles = (w1px: number, h1px: number, fs1px: number) =>
    StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'space-between',
            paddingTop: 40 * h1px,
            paddingBottom: 24 * h1px,
            paddingHorizontal: 16 * w1px,
        },

        // Logo
        logoContent: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        },
        logoImg: { alignItems: 'center' },
        imageView: {
            alignSelf: 'center',
            width: 220 * w1px,
            height: 220 * h1px,
            resizeMode: 'contain',
            marginBottom: 8 * h1px,
        },

        // İçerik kartı
        containerView: {
            position: 'relative',
            bottom: h1px * 10,
            alignItems: 'center',
            justifyContent: 'center',
        },
        scrollContainer: {
            height: 400 * h1px,
            width: '100%',
            backgroundColor: '#fff',
            borderRadius: 12 * w1px,
            paddingHorizontal: 14 * w1px,
            paddingVertical: 10 * h1px,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            marginBottom: 20 * h1px,
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 12 * w1px,
            shadowOffset: { width: 0, height: 6 },
            elevation: 2,
        },
        scrollView: { flexGrow: 0 },

        // Checkbox
        checkboxRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 18 * h1px,
            alignSelf: 'flex-start',
        },
        checkbox: {
            width: 22 * w1px,
            height: 22 * h1px,
            borderWidth: 2,
            borderColor: colors.backgroundPruple,
            borderRadius: 4 * w1px,
        },
    });
