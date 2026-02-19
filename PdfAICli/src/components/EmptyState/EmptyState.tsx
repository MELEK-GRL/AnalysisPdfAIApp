import React, { useMemo } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useResponsive } from '../../utils/deviceStore/device';
import T from '../Text/T';
import { fontSize } from '../../constants/typography';

type Props = {
    title: string;
    subtitle?: string;
    style?: object;
};

const EmptyState: React.FC<Props> = ({ title, subtitle, style }) => {
    const { w1px, h1px } = useResponsive();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: {
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 40 * h1px,
                },
                imageView: {
                    alignSelf: 'center',
                    width: 80 * w1px,
                    height: 80 * h1px,
                    resizeMode: 'contain',
                    marginBottom: 12 * h1px,
                },
                title: {
                    marginBottom: subtitle ? 8 * h1px : 0,
                },
            }),
        [w1px, h1px, subtitle],
    );

    return (
        <View style={[styles.container, style]}>
            <Image
                source={require('../../assets/icons/noData.png')}
                style={styles.imageView}
            />
            <T size={fontSize.subtitle} weight="700" color="#6B7280" style={styles.title}>
                {title}
            </T>
            {subtitle ? (
                <T size={fontSize.body} color="#9CA3AF">
                    {subtitle}
                </T>
            ) : null}
        </View>
    );
};

export default EmptyState;
