import React, { useMemo } from 'react';
import { Text, TextStyle, StyleSheet, TextProps } from 'react-native';
import { useResponsive } from '../../utils/deviceStore/device';

type Props = TextProps & {
    children: React.ReactNode;
    size?: number; // Yazı boyutu (örnek: 14)
    weight?:
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900';
    color?: string; // Renk kodu
    align?: 'left' | 'center' | 'right';
    style?: TextStyle; // Ek stil
};

const T: React.FC<Props> = ({
    children,
    size = 14,
    weight = 'semibold',
    color = '#111827',
    align = 'left',
    style,
    ...rest
}) => {
    const { fs1px } = useResponsive();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                text: {
                    fontSize: size * fs1px,
                    fontWeight: weight,
                    color,
                    textAlign: align,
                    fontFamily: 'System', // 🔹 Default font — istersen Roboto, SF Pro vs. yapabiliriz
                },
            }),
        [size, weight, color, align, fs1px],
    );

    return (
        <Text style={[styles.text, style]} {...rest}>
            {children}
        </Text>
    );
};

export default T;
