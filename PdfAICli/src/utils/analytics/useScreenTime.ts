import React, { useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { trackScreenView } from '../../server/api/Analytics';

/**
 * Ekran süresini takip eder. Ekrana girildiğinde başlar, çıkıldığında süreyi hesaplar
 * ve trackScreenView ile gönderir.
 */
export function useScreenTime(screenName: string): void {
    const startRef = useRef<number | null>(null);

    useFocusEffect(
        React.useCallback(() => {
            startRef.current = Date.now();
            return () => {
                if (startRef.current !== null) {
                    const durationSeconds = Math.round(
                        (Date.now() - startRef.current) / 1000
                    );
                    trackScreenView(screenName, durationSeconds);
                    startRef.current = null;
                }
            };
        }, [screenName])
    );
}
