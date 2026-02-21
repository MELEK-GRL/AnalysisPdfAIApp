import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useResponsive } from '../../utils/deviceStore/device';
import T from '../Text/T';
import colors from '../../theme/colors';
import { fontSize } from '../../constants/typography';

/** Sayfa başlığı – tüm sayfalarda üst/alt boşluklar eşit, içerik bu bileşenin altından başlar. */
type Props = {
    title: string;
};

/** Üst ve alt boşluk eşit (tüm sayfalarda aynı). */
const PAGE_HEADER_VERTICAL = 18;

const PageHeader: React.FC<Props> = ({ title }) => {
    const { w1px, h1px } = useResponsive();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                wrap: {
                    paddingTop: PAGE_HEADER_VERTICAL * h1px,
                    paddingBottom: PAGE_HEADER_VERTICAL * h1px,
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
