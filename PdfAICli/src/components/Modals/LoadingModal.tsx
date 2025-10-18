import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { useResponsive } from '../../utils/deviceStore/device';

type Props = {
    visible: boolean;
};

const LoadingModal: React.FC<Props> = ({ visible }) => {
    const { w1px, h1px } = useResponsive();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                overlay: {
                    ...StyleSheet.absoluteFillObject,
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
            }),
        [w1px, h1px],
    );

    if (!visible) {
        return null;
    }

    return (
        <View style={styles.overlay}>
            <View style={styles.box}>
                <LottieView
                    source={require('../../assets/splash/LoadingAnimation.json')}
                    autoPlay
                    loop
                    style={styles.lottie}
                />
            </View>
        </View>
    );
};

export default LoadingModal;
