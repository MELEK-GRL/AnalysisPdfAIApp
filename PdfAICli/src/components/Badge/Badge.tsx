/**
 * Küçük durum / etiket rozeti (pill).
 */
import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useResponsive } from '../../utils/deviceStore/device';
import T from '../Text/T';
import colors from '../../theme/colors';
import { fontSize } from '../../constants/typography';
import { iconSize } from '../../constants/icons';

export type BadgeTone = 'danger' | 'info' | 'neutral' | 'purple' | 'success';

type Props = {
    label: string;
    tone?: BadgeTone;
    icon?: string;
    style?: ViewStyle;
};

const TONE: Record<
    BadgeTone,
    { bg: string; border: string; text: string }
> = {
    danger: {
        bg: 'rgba(220, 38, 38, 0.1)',
        border: 'rgba(220, 38, 38, 0.25)',
        text: colors.danger,
    },
    info: {
        bg: 'rgba(37, 99, 235, 0.1)',
        border: 'rgba(37, 99, 235, 0.25)',
        text: '#2563EB',
    },
    neutral: {
        bg: '#F3F4F6',
        border: '#E5E7EB',
        text: '#6B7280',
    },
    purple: {
        bg: colors.backgroundPurpleSoft,
        border: 'rgba(116, 83, 224, 0.2)',
        text: colors.backgroundPurple,
    },
    success: {
        bg: 'rgba(34, 197, 94, 0.12)',
        border: 'rgba(34, 197, 94, 0.28)',
        text: '#16A34A',
    },
};

const Badge: React.FC<Props> = ({ label, tone = 'purple', icon, style }) => {
    const { w1px, h1px } = useResponsive();
    const palette = TONE[tone];

    const styles = useMemo(
        () =>
            StyleSheet.create({
                root: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4 * w1px,
                    backgroundColor: palette.bg,
                    borderColor: palette.border,
                    borderWidth: 1,
                    borderRadius: 999,
                    paddingVertical: 4 * h1px,
                    paddingHorizontal: 8 * w1px,
                    maxWidth: 190 * w1px,
                    flexShrink: 1,
                },
            }),
        [w1px, h1px, palette.bg, palette.border],
    );

    return (
        <View style={[styles.root, style]} accessibilityRole="text">
            {icon ? (
                <Ionicons name={icon} size={iconSize.small} color={palette.text} />
            ) : null}
            <T
                size={fontSize.label}
                weight="700"
                color={palette.text}
                numberOfLines={1}>
                {label}
            </T>
        </View>
    );
};

export default Badge;
