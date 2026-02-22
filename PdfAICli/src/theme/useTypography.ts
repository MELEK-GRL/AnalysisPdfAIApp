import { useMemo } from 'react';
import { useResponsive } from '../utils/deviceStore/device';
import {
    fontFamily as defaultFontFamily,
    baseFontSize,
    baseLineHeight,
    getScaledSizes,
    clampFontScale,
    FONT_SIZE_MULTIPLIER,
    type FontSizeKey,
} from './typography';

/**
 * Ekran boyutuna göre hesaplanmış tipografi. Tüm ekranlarda ve StyleSheet kullanılan
 * yerlerde bu hook ile fontFamily, fontSize ve lineHeight kullanın.
 */
export function useTypography() {
    const { fs1px } = useResponsive();
    const scale = useMemo(
        () => clampFontScale(fs1px) * FONT_SIZE_MULTIPLIER,
        [fs1px],
    );

    return useMemo(() => {
        const fontSize = getScaledSizes(scale);
        const lineHeight: Record<FontSizeKey, number> = {} as Record<FontSizeKey, number>;
        (Object.keys(baseFontSize) as FontSizeKey[]).forEach(key => {
            lineHeight[key] = Math.round(baseFontSize[key] * baseLineHeight[key] * scale);
        });

        const scaledSize = (key: FontSizeKey): number => fontSize[key];

        return {
            fontFamily: defaultFontFamily,
            fontSize,
            lineHeight,
            scaledSize,
            /** Mevcut ekrana göre font ölçek faktörü (clamp'li). T bileşeninde size * scale için kullanılır. */
            scale,
        };
    }, [scale]);
}
