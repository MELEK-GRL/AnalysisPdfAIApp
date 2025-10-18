import React from 'react';
import { View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useResponsive } from '../../utils/deviceStore/device';

type Props = {
    children: React.ReactNode;
    gradientColors?: [string, string];
    topBlobColor?: string;
    bottomBlobColor?: string;
    style?: object;
};

const GradientLayout: React.FC<Props> = ({
    children,
    gradientColors = ['#FFFFFF', '#F5F3FF'],
    topBlobColor = '#8B5CF6',
    bottomBlobColor = '#8B5CF6',
    style,
}) => {
    const { w1px, h1px } = useResponsive();

    const s = StyleSheet.create({
        gradient: {
            flex: 1,
            justifyContent: 'space-between',
        },
        blob: {
            position: 'absolute',
            width: 240 * w1px,
            height: 240 * h1px,
            borderRadius: 2000,
            backgroundColor: '#8B5CF6',
            opacity: 0.06,
        },
        blobTop: { top: -70 * h1px, left: -70 * w1px },
        blobBottom: { bottom: -80 * h1px, right: -90 * w1px },
        inner: { flex: 1, zIndex: 2 },
    });

    return (
        <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[s.gradient, style]}>
            <View style={[s.blob, s.blobTop, { backgroundColor: topBlobColor }]} />
            <View
                style={[s.blob, s.blobBottom, { backgroundColor: bottomBlobColor }]}
            />
            <View style={s.inner}>{children}</View>
        </LinearGradient>
    );
};

export default GradientLayout;
