import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useResponsive } from '../../utils/deviceStore/device';
import T from '../Text/T';
import colors from '../../theme/colors';
import { fontSize } from '../../constants/typography';

type Props = {
    title: string;
};

const TitleHeader: React.FC<Props> = ({ title }) => {
    const { w1px, h1px } = useResponsive();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                wrap: {
                    paddingTop: 10 * h1px,
                    paddingBottom: 6 * h1px,
                    paddingHorizontal: 0,
                },
                title: {
                    color: colors.textDark,
                },
            }),
        [w1px, h1px],
    );

    return (
        <View style={styles.wrap}>
            <T size={fontSize.title} weight="700" color={colors.textDark} style={styles.title}>
                {title}
            </T>
        </View>
    );
};

export default TitleHeader;
