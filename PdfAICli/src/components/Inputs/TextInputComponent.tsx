import React, { useMemo } from 'react';
import {
    TextInput,
    View,
    StyleSheet,
    ViewStyle,
    TextInputProps,
} from 'react-native';
import { useResponsive } from '../../utils/deviceStore/device';
import T from '../Text/T';
import colors from '../../theme/colors';

type Props = TextInputProps & {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
};

const TextInputComponent: React.FC<Props> = ({
    label,
    error,
    containerStyle,
    ...props
}) => {
    const { w1px, h1px, fs1px } = useResponsive();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: {
                    marginBottom: 14 * h1px,
                },
                label: {
                    marginBottom: 8 * h1px,
                },
                input: {
                    borderWidth: 1,
                    borderColor: error ? '#ef4444' : colors.inputBorder,
                    borderRadius: 8 * w1px,
                    paddingVertical: 14 * h1px,
                    paddingHorizontal: 12 * w1px,
                    fontSize: 14 * fs1px,
                    color: '#111827',
                },
                errorText: {
                    marginTop: 4 * h1px,
                },
            }),
        [w1px, h1px, fs1px, error],
    );

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <T
                    size={18}
                    weight="700"
                    color={colors.textGraySoft}
                    style={styles.label}>
                    {label}
                </T>
            )}

            <TextInput
                placeholderTextColor={colors.buttonGray}
                style={styles.input}
                {...props}
            />

            {error && (
                <T size={16} color="#ef4444" style={styles.errorText}>
                    {error}
                </T>
            )}
        </View>
    );
};

export default TextInputComponent;
