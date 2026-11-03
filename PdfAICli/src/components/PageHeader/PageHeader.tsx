import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useResponsive } from '../../utils/deviceStore/device';
import T from '../Text/T';
import colors from '../../theme/colors';
import { fontSize } from '../../constants/typography';

/** Sayfa başlığı – tüm sayfalarda aynı dikey ritim; içerik bu bileşenin altından başlar. */
type Props = {
    title: string;
};

/** Üst/alt eşit ve sıkı standart (Header altında ekstra top inset yok). */
const PAGE_HEADER_TOP = 20;
const PAGE_HEADER_BOTTOM = 12;

const PageHeader: React.FC<Props> = ({ title }) => {
    const { w1px, h1px } = useResponsive();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                wrap: {
                    paddingTop: PAGE_HEADER_TOP * h1px,
                    paddingBottom: PAGE_HEADER_BOTTOM * h1px,
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

export default PageHeader;
