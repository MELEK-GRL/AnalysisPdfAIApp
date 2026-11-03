import React, { useEffect, useRef, useState } from 'react';
import { View, Dimensions, AppState, AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import AnalysisModalRoot from './src/components/Modals/AnalysisModalRoot';
import LoadingModal from './src/components/Modals/LoadingModal';
import useDeviceStore from './src/store/useDeviceStore';
import { useAnalysisLoadingStore } from './src/store/useAnalysisLoadingStore';
import { useLocaleStore } from './src/store/useLocaleStore';
import { useInactivityTimeout } from './src/hooks/useInactivityTimeout';

/** Hızlı 429 / hata cevaplarında "1–2 dk bekleyin" flaşını engeller */
const ANALYSIS_LOADING_UI_DELAY_MS = 350;

const App = () => {
  const setDimensions = useDeviceStore(state => state.setDimensions);
  const appState = useRef(AppState.currentState);
  const adUiLocked = useAnalysisLoadingStore(s => s.adUiLocked);
  const lockEpoch = useAnalysisLoadingStore(s => s.lockEpoch);
  const analysisLoading = useAnalysisLoadingStore(s => s.loading);
  const [showAnalysisLoadingUi, setShowAnalysisLoadingUi] = useState(false);

  useInactivityTimeout();

  useEffect(() => {
    if (!analysisLoading) {
      setShowAnalysisLoadingUi(false);
      return;
    }
    const id = setTimeout(
      () => setShowAnalysisLoadingUi(true),
      ANALYSIS_LOADING_UI_DELAY_MS,
    );
    return () => clearTimeout(id);
  }, [analysisLoading]);

  useEffect(() => {
    const updateDimensions = () => {
      const { width, height } = Dimensions.get('window');
      setDimensions(width, height);
    };

    const dimensionSub = Dimensions.addEventListener(
      'change',
      updateDimensions,
    );
    updateDimensions();

    return () => dimensionSub.remove();
  }, [setDimensions]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      appState.current = nextState;
      // Native reklamdan dönünce Modal/overlay’i yenile
      if (
        nextState === 'active' &&
        useAnalysisLoadingStore.getState().adUiLocked
      ) {
        useAnalysisLoadingStore.getState().remountAdLock();
      }
    };
    const stateSub = AppState.addEventListener('change', handleAppStateChange);
    return () => stateSub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        {/* Asıl tıklama engeli: navigator tamamen pasif */}
        <View
          style={{ flex: 1 }}
          pointerEvents={adUiLocked || showAnalysisLoadingUi ? 'none' : 'auto'}>
          <AppNavigator />
          <AnalysisModalRoot />
        </View>
        {/* Analiz yükleme — root overlay (navigator Modal flaşı yok) */}
        <LoadingModal
          visible={showAnalysisLoadingUi}
          variant="overlay"
          message={
            showAnalysisLoadingUi
              ? useLocaleStore.getState().t('home.analysisLoadingHint')
              : undefined
          }
        />
        {/* Görsel kilit — Modal + overlay (native dönüşte epoch ile yenilenir) */}
        <LoadingModal
          key={`ad-modal-${lockEpoch}`}
          visible={adUiLocked}
          variant="modal"
        />
        <LoadingModal visible={adUiLocked} variant="overlay" />
      </View>
    </SafeAreaProvider>
  );
};

export default App;
