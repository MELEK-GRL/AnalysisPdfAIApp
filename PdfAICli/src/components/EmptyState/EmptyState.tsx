import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useResponsive } from '../../utils/deviceStore/device';
import { fontSize } from '../../constants/typography';
import { iconSize } from '../../constants/icons';
import colors from '../../theme/colors';
import { useTypography } from '../../theme/useTypography';

type Props = {
    title: string;
    subtitle?: string;
    style?: object;
};

const EmptyState: React.FC<Props> = ({ title, subtitle, style }) => {
    const { w1px, h1px } = useResponsive();
    const { fontFamily, scale } = useTypography();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: {
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 40 * h1px,
                    paddingHorizontal: 20 * w1px,
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
                    width: '100%',
                    alignSelf: 'stretch',
                    textAlign: 'center',
                    fontSize: fontSize.subtitle * scale,
                    fontWeight: 'normal',
                    fontFamily,
                    color: '#6B7280',
                    marginBottom: subtitle ? 8 * h1px : 0,
                    lineHeight: Math.round(fontSize.subtitle * scale * 1.35),
                },
                subtitle: {
                    width: '100%',
                    alignSelf: 'stretch',
                    textAlign: 'center',
                    fontSize: fontSize.body * scale,
                    fontWeight: 'normal',
                    fontFamily,
                    color: '#9CA3AF',
                    lineHeight: Math.round(fontSize.body * scale * 1.35),
                },
            }),
        [w1px, h1px, subtitle, fontFamily, scale],
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
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
    );
};

export default EmptyState;
