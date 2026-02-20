import React, { useMemo, useState } from 'react';
import {
    TextInput,
    View,
    StyleSheet,
    ViewStyle,
    TextInputProps,
    TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useResponsive } from '../../utils/deviceStore/device';
import T from '../Text/T';
import colors from '../../theme/colors';
import { fontSize } from '../../constants/typography';
import { iconSize } from '../../constants/icons';

type Props = TextInputProps & {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
    /** Şifre alanında sağda göz ikonu ile göster/gizle (secureTextEntry ile birlikte kullanın) */
    passwordToggle?: boolean;
};

const TextInputComponent: React.FC<Props> = ({
    label,
    error,
    containerStyle,
    passwordToggle = false,
    secureTextEntry,
    ...props
}) => {
    const { w1px, h1px, fs1px } = useResponsive();
    const [visible, setVisible] = useState(false);
    const isPassword = secureTextEntry === true || passwordToggle;
    const showPassword = passwordToggle ? visible : !secureTextEntry;

    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: {
                    marginBottom: 14 * h1px,
                },
                label: {
                    marginBottom: 8 * h1px,
                },
                inputWrap: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: error ? '#ef4444' : colors.inputBorder,
                    borderRadius: 8 * w1px,
                    backgroundColor: '#fff',
                },
                input: {
                    flex: 1,
                    paddingVertical: 14 * h1px,
                    paddingHorizontal: 12 * w1px,
                    fontSize: fontSize.body * fs1px,
                    color: '#111827',
                    paddingRight: passwordToggle ? 44 * w1px : 12 * w1px,
                },
                eyeTouch: {
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    paddingHorizontal: 12 * w1px,
                    justifyContent: 'center',
                },
                errorText: {
                    marginTop: 4 * h1px,
                },
            }),
        [w1px, h1px, fs1px, error, passwordToggle],
    );

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <T
                    size={fontSize.title}
                    weight="700"
                    color={colors.textGraySoft}
                    style={styles.label}>
                    {label}
                </T>
            )}

            <View style={styles.inputWrap}>
                <TextInput
                    placeholderTextColor={colors.buttonGray}
                    style={styles.input}
                    secureTextEntry={isPassword ? !showPassword : secureTextEntry}
                    {...props}
                />
                {passwordToggle && (
                    <TouchableOpacity
                        style={styles.eyeTouch}
                        onPress={() => setVisible(v => !v)}
                        activeOpacity={0.7}
                        accessibilityLabel={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}>
                        <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={iconSize.medium}
                            color={colors.textGraySoft}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {error && (
                <T size={fontSize.subtitle} color="#ef4444" style={styles.errorText}>
                    {error}
                </T>
            )}
        </View>
    );
};

export default TextInputComponent;
