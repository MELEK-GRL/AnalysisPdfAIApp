import React, { useMemo } from 'react';
import { SafeAreaView, View, StyleSheet, ViewStyle } from 'react-native';
import { useResponsive } from '../../utils/deviceStore/device';

type Props = {
    children: React.ReactNode;
    style?: ViewStyle;
    bgColor?: string;
    paddingVertical?: number;
    paddingHorizontal?: number;
};

const PageLayout: React.FC<Props> = ({
    children,
    style,
    bgColor = 'white',
    paddingHorizontal = 16,
    paddingVertical = 0,
}) => {
    const { w1px, h1px } = useResponsive();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                safe: {
                    flex: 1,
                    backgroundColor: bgColor,
                },
                container: {
                    flex: 1,
                    paddingHorizontal: paddingHorizontal * w1px,
                    paddingVertical: paddingVertical * h1px,
                },
            }),
        [bgColor, w1px, h1px, paddingVertical, paddingHorizontal],
    );

    return (
        <SafeAreaView style={[styles.safe, style]}>
            <View style={styles.container}>{children}</View>
        </SafeAreaView>
    );
};

export default PageLayout;
