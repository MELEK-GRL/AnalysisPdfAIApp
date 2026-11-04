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
                balloon: {
                    alignItems: 'center',
                    zIndex: 1,
                },
                messageWrap: {
                    backgroundColor: 'rgba(248, 246, 255, 0.86)',
                    borderRadius: 28 * w1px,
                    paddingVertical: 14 * h1px,
                    paddingHorizontal: 22 * w1px,
                    borderWidth: 1,
                    borderColor: 'rgba(116, 83, 224, 0.14)',
                    shadowColor: '#3A3496',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.16,
                    shadowRadius: 14,
                    elevation: 6,
                },
                balloonTail: {
                    width: 0,
                    height: 0,
                    marginTop: -1,
                    borderLeftWidth: 9 * w1px,
                    borderRightWidth: 9 * w1px,
                    borderTopWidth: 10 * h1px,
                    borderLeftColor: 'transparent',
                    borderRightColor: 'transparent',
                    borderTopColor: 'rgba(248, 246, 255, 0.86)',
                },
                message: {
                    textAlign: 'center',
                    letterSpacing: 0.2,
                    lineHeight: 24 * h1px,
                },
                lottie: {
                    width: 160 * w1px,
                    height: 160 * h1px,
                    marginTop: -36 * h1px,
                    backgroundColor: 'transparent',
                },
            }),
        [w1px, h1px],
    );

    const content = (
        <View style={styles.box} pointerEvents="none">
            {message ? (
                <View style={styles.balloon}>
                    <View style={styles.messageWrap}>
                        <T
                            size={fontSize.subtitle}
                            weight="600"
                            color={colors.backgroundPurpleDark}
                            align="center"
                            style={styles.message}>
                            {message}
                        </T>
                    </View>
                    <View style={styles.balloonTail} />
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
