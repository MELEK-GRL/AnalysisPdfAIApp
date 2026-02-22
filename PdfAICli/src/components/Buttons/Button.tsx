// src/components/Buttons/Button.tsx
import React, { useMemo } from 'react';
import {
    TouchableOpacity,
    StyleSheet,
    ViewStyle,
    ActivityIndicator,
    View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useResponsive } from '../../utils/deviceStore/device';
import LoadingModal from '../Modals/LoadingModal';
import T from '../Text/T';
import colors from '../../theme/colors';
import { fontSize } from '../../constants/typography';

const PURPLE_GRADIENT: [string, string] = [
    colors.backgroundPurpleDark,
    '#8B6FEB',
];

type Props = {
    buttonText: string;
    onPress?: () => void;
    disabled?: boolean;
    loading?: boolean;
    activityIndicatorLoading?: boolean;
    style?: ViewStyle;
    width?: number | string;
    backgroundColor?: string;
};

const Button: React.FC<Props> = ({
    buttonText,
    onPress,
    disabled = false,
    loading = false,
    activityIndicatorLoading = false,
    style,
    width = '100%',
    backgroundColor = colors.backgroundPurple,
}) => {
    const { w1px, h1px } = useResponsive();

    const isPurple =
        backgroundColor === colors.backgroundPurple ||
        backgroundColor === colors.backgroundPurpleDark;

    const styles = useMemo(
        () =>
            StyleSheet.create({
                button: {
                    backgroundColor: isPurple ? undefined : backgroundColor,
                    borderRadius: 16 * w1px,
                    paddingVertical: 10 * h1px,
                    paddingHorizontal: 12 * h1px,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: disabled ? 0.5 : 1,
                    flexDirection: 'row',
                    gap: 8 * w1px,
                    width,
                    overflow: 'hidden',
                },
                buttonView: {
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                },
            }),
        [w1px, h1px, disabled, width, backgroundColor, isPurple],
    );

    const content = (
        <>
            {activityIndicatorLoading && (
                <ActivityIndicator size="small" color="#fff" />
            )}
            <T size={fontSize.subtitle} weight="600" color="#fff">
                {buttonText}
            </T>
        </>
    );

    return (
        <>
            <View style={styles.buttonView}>
                <TouchableOpacity
                    onPress={onPress}
                    activeOpacity={0.8}
                    disabled={disabled || loading || activityIndicatorLoading}
                    style={[{ width }, style]}>
                    {isPurple ? (
                        <LinearGradient
                            colors={PURPLE_GRADIENT}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={[styles.button, style]}>
                            {content}
                        </LinearGradient>
                    ) : (
                        <View style={[styles.button, style]}>{content}</View>
                    )}
                </TouchableOpacity>
            </View>

            <LoadingModal visible={loading} />
        </>
    );
};

export default Button;
