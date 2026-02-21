import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import AnalysisModalRoot from './src/components/Modals/AnalysisModalRoot';
import { Dimensions, AppState, AppStateStatus } from 'react-native';
import useDeviceStore from './src/store/useDeviceStore';
import { useInactivityTimeout } from './src/hooks/useInactivityTimeout';

const App = () => {
  const setDimensions = useDeviceStore(state => state.setDimensions);
  const appState = useRef(AppState.currentState);

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
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      appState.current = nextState;
    };
    const stateSub = AppState.addEventListener('change', handleAppStateChange);
    return () => stateSub.remove();
  }, []);
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <AppNavigator />
        <AnalysisModalRoot />
      </View>
    </SafeAreaProvider>
  );
};

export default App;