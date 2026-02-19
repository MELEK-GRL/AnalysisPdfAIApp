import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useResponsive } from '../../utils/deviceStore/device';
import T from '../Text/T';
import { fontSize } from '../../constants/typography';
import { iconSize } from '../../constants/icons';
import colors from '../../theme/colors';

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
                iconWrap: {
                    width: 88 * w1px,
                    height: 88 * w1px,
                    borderRadius: 44 * w1px,
                    backgroundColor: colors.backgroundPurpleSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16 * h1px,
                    borderWidth: 1,
                    borderColor: 'rgba(116, 83, 224, 0.15)',
                },
                title: {
                    marginBottom: subtitle ? 8 * h1px : 0,
                },
            }),
        [w1px, h1px, subtitle],
    );

    return (
        <View style={[styles.container, style]}>
            <View style={styles.iconWrap}>
                <Ionicons
                    name="document-text-outline"
                    size={iconSize.xxl}
                    color={colors.backgroundPurple}
                />
            </View>
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
