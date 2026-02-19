import React, { useMemo } from 'react';
import { Text, TextStyle, StyleSheet, TextProps } from 'react-native';
import { useResponsive } from '../../utils/deviceStore/device';
import { fontSize } from '../../constants/typography';

type Props = TextProps & {
    children: React.ReactNode;
    size?: number;
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
    color?: string;
    align?: 'left' | 'center' | 'right';
    style?: TextStyle;
};

const T: React.FC<Props> = ({
    children,
    size = fontSize.body,
    weight = '600',
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
                    fontFamily: 'System',
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
