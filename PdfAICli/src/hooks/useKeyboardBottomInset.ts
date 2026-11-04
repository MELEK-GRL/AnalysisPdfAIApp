import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Cihaz klavye yüksekliğine göre alt boşluk.
 * Aşırı kaymayı önlemek için yüksekliğin bir kısmını kullanır;
 * adjustResize ile birlikte de dengeli kalır.
 */
export function useKeyboardBottomInset(factor = 0.55): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, e => {
      const h = e.endCoordinates?.height ?? 0;
      setInset(Math.max(0, Math.round(h * factor)));
    });
    const onHide = Keyboard.addListener(hideEvent, () => setInset(0));

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [factor]);

  return inset;
}
