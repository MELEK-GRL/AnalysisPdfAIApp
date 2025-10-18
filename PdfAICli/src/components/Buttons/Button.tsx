// src/components/Buttons/Button.tsx
import React, { useMemo } from 'react';
import {
    TouchableOpacity,
    StyleSheet,
    ViewStyle,
    ActivityIndicator,
    View,
} from 'react-native';
import { useResponsive } from '../../utils/deviceStore/device';
import LoadingModal from '../Modals/LoadingModal';
import T from '../Text/T';
import colors from '../../theme/colors';

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
    backgroundColor = colors.backgroundPruple, // 🔹 Varsayılan renk
}) => {
    const { w1px, h1px } = useResponsive();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                button: {
                    backgroundColor: backgroundColor,
                    borderRadius: 16 * w1px,
                    paddingVertical: 10 * h1px,
                    paddingHorizontal: 12 * h1px,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: disabled ? 0.5 : 1,
                    flexDirection: 'row',
                    gap: 8 * w1px,
                    width,
                },
                buttonView: {
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                },
            }),
        [w1px, h1px, disabled, width, backgroundColor],
    );

    return (
        <>
            <View style={styles.buttonView}>
                <TouchableOpacity
                    style={[styles.button, style]}
                    onPress={onPress}
                    activeOpacity={0.8}
                    disabled={disabled || loading || activityIndicatorLoading}>
                    {activityIndicatorLoading && (
                        <ActivityIndicator size="small" color="#fff" />
                    )}
                    <T size={16} weight="600" color="#fff">
                        {buttonText}
                    </T>
                </TouchableOpacity>
            </View>

            <LoadingModal visible={loading} />
        </>
    );
};

export default Button;
