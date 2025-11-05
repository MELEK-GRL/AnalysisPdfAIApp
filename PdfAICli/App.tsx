import React, { useEffect, useRef } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { Dimensions, AppState, AppStateStatus } from 'react-native';
import useDeviceStore from './src/store/useDeviceStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (
        appState.current.match(/active|inactive/) &&
        nextState === 'background'
      ) {
        console.log('📴 Uygulama kapatıldı, oturum siliniyor...');
        await AsyncStorage.multiRemove(['token', 'user']);
      }
      appState.current = nextState;
    };

    const stateSub = AppState.addEventListener('change', handleAppStateChange);
    return () => stateSub.remove();
  }, []);
  return <AppNavigator />;
};

export default App;
//jlj