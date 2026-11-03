import React, { useEffect, useRef } from 'react';
import { View, Dimensions, AppState, AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import AnalysisModalRoot from './src/components/Modals/AnalysisModalRoot';
import LoadingModal from './src/components/Modals/LoadingModal';
import useDeviceStore from './src/store/useDeviceStore';
import { useAnalysisLoadingStore } from './src/store/useAnalysisLoadingStore';
import { useInactivityTimeout } from './src/hooks/useInactivityTimeout';

const App = () => {
  const setDimensions = useDeviceStore(state => state.setDimensions);
  const appState = useRef(AppState.currentState);
  const adUiLocked = useAnalysisLoadingStore(s => s.adUiLocked);
  const lockEpoch = useAnalysisLoadingStore(s => s.lockEpoch);

  useInactivityTimeout();

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
        <View style={{ flex: 1 }} pointerEvents={adUiLocked ? 'none' : 'auto'}>
          <AppNavigator />
          <AnalysisModalRoot />
        </View>
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
