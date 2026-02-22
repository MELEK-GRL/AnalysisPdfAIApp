import React, { useMemo } from 'react';
import { View, StyleSheet, Modal, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { useResponsive } from '../../utils/deviceStore/device';
import { useT } from '../../store/useLocaleStore';
import T from '../Text/T';
import colors from '../../theme/colors';
import { fontSize } from '../../constants/typography';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

type Props = {
    visible: boolean;
};

const LoadingModal: React.FC<Props> = ({ visible }) => {
    const { w1px, h1px } = useResponsive();
    const t = useT();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                fullScreen: {
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: SCREEN_WIDTH,
                    height: SCREEN_HEIGHT,
                    backgroundColor: 'rgba(17, 24, 39, 0.40)',
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                box: { alignItems: 'center' },
                lottie: {
                    width: 200 * w1px,
                    height: 200 * h1px,
                    backgroundColor: 'transparent',
                },
                label: {
                    marginTop: 4 * h1px,
                },
            }),
        [w1px, h1px],
    );

    if (!visible) {
        return null;
    }

    return (
        <Modal
            visible={visible}
            transparent
            statusBarTranslucent
            animationType="fade"
            onRequestClose={() => {}}>
            <View style={styles.fullScreen} pointerEvents="auto">
                <View style={styles.box}>
                    <LottieView
                        source={require('../../assets/splash/LoadingAnimation.json')}
                        autoPlay
                        loop
                        style={styles.lottie}
                    />
                    <T size={fontSize.title} weight="700" color={colors.white} style={styles.label}>
                        {t('common.dataLoading')}
                    </T>
                </View>
            </View>
        </Modal>
    );
};

export default LoadingModal;
