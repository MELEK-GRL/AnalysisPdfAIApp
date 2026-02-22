import React, { useMemo } from 'react';
import { Text, TextStyle, StyleSheet, TextProps } from 'react-native';
import { fontSize } from '../../constants/typography';
import { useTypography } from '../../theme/useTypography';

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
    const { fontFamily, scale } = useTypography();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                text: {
                    fontSize: size * scale,
                    fontWeight: weight,
                    color,
                    textAlign: align,
                    fontFamily,
                },
            }),
        [size, weight, color, align, fontFamily, scale],
    );

    return (
        <Text style={[styles.text, style]} {...rest}>
            {children}
        </Text>
    );
};

export default T;
