import React, { useMemo } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import LottieView from 'lottie-react-native';
import { useResponsive } from '../../utils/deviceStore/device';
import T from '../Text/T';
import { fontSize } from '../../constants/typography';
import colors from '../../theme/colors';

type Props = {
    visible: boolean;
    /** Loading ikonunun üstünde gösterilecek metin */
    message?: string;
    /**
     * modal: RN Modal (analiz yükleme)
     * overlay: View absoluteFill — native reklam sonrası da tıklamayı keser
     */
    variant?: 'modal' | 'overlay';
};

const LoadingModal: React.FC<Props> = ({
    visible,
    message,
    variant = 'modal',
}) => {
    const { w1px, h1px } = useResponsive();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                fullScreen: {
                    flex: 1,
                    backgroundColor: 'rgba(17, 24, 39, 0.40)',
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                overlay: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 99999,
                    elevation: 99999,
                    backgroundColor: 'rgba(17, 24, 39, 0.45)',
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                box: {
                    alignItems: 'center',
                    paddingHorizontal: 24 * w1px,
                    maxWidth: 340 * w1px,
                },
                messageCard: {
                    backgroundColor: colors.white,
                    borderRadius: 18 * w1px,
                    paddingVertical: 16 * h1px,
                    paddingHorizontal: 22 * w1px,
                    marginBottom: 0,
                    borderWidth: 1,
                    borderColor: colors.backgroundPurple + '28',
                    shadowColor: colors.backgroundPurple,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.18,
                    shadowRadius: 20,
                    elevation: 8,
                    zIndex: 1,
                },
                message: {
                    textAlign: 'center',
                    letterSpacing: 0.15,
                    lineHeight: 24 * h1px,
                },
                lottie: {
                    width: 200 * w1px,
                    height: 200 * h1px,
                    marginTop: -28 * h1px,
                    backgroundColor: 'transparent',
                },
            }),
        [w1px, h1px],
    );

    const content = (
        <View style={styles.box} pointerEvents="none">
            {message ? (
                <View style={styles.messageCard}>
                    <T
                        size={fontSize.subtitle}
                        weight="600"
                        color={colors.backgroundPurpleDark}
                        align="center"
                        style={styles.message}>
                        {message}
                    </T>
                </View>
            ) : null}
            <LottieView
                source={require('../../assets/splash/LoadingAnimation.json')}
                autoPlay
                loop
                style={styles.lottie}
            />
        </View>
    );

    if (variant === 'overlay') {
        if (!visible) {
            return null;
        }
        return (
            <View
                style={styles.overlay}
                pointerEvents="auto"
                accessibilityViewIsModal>
                {content}
            </View>
        );
    }

    return (
        <Modal
            visible={visible}
            transparent
            statusBarTranslucent
            hardwareAccelerated
            presentationStyle="overFullScreen"
            animationType="fade"
            onRequestClose={() => {}}>
            <View style={styles.fullScreen} pointerEvents="auto">
                {content}
            </View>
        </Modal>
    );
};

export default LoadingModal;
