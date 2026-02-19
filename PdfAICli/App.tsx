import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import AnalysisModalRoot from './src/components/Modals/AnalysisModalRoot';
import { Dimensions, AppState, AppStateStatus } from 'react-native';
import useDeviceStore from './src/store/useDeviceStore';
const App = () => {
  const setDimensions = useDeviceStore(state => state.setDimensions);
  const appState = useRef(AppState.currentState);

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
    <View style={{ flex: 1 }}>
      <AppNavigator />
      <AnalysisModalRoot />
    </View>
  );
};

export default App;