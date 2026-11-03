import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { useResponsive } from '../../utils/deviceStore/device';

type Props = {
    /** sm: kompakt (modal içi), md: varsayılan */
    size?: 'sm' | 'md';
};

const LoadingIndicator: React.FC<Props> = ({ size = 'md' }) => {
    const { w1px, h1px } = useResponsive();
    const dim = size === 'sm' ? 120 : 200;

    const styles = useMemo(
        () =>
            StyleSheet.create({
                wrap: {
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                lottie: {
                    width: dim * w1px,
                    height: dim * h1px,
                    backgroundColor: 'transparent',
                },
            }),
        [w1px, h1px, dim],
    );

    return (
        <View style={styles.wrap} pointerEvents="none">
            <LottieView
                source={require('../../assets/splash/LoadingAnimation.json')}
                autoPlay
                loop
                style={styles.lottie}
            />
        </View>
    );
};

export default LoadingIndicator;
