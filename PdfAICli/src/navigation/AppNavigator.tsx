import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../server/apiFetcher';

import Home from '../screens/Home';
import Register from '../screens/Register';
import Login from '../screens/Login';
import InfoSplash from '../screens/Splashs/InfoSplash';
import SplashTwo from '../screens/SplashTwo/SplashTwo';
import Logout from '../screens/Logout';

export type RootStackParamList = {
    InfoSplash: undefined;
    SplashTwo: undefined;
    Login: undefined;
    Register: undefined;
    Home: undefined;
    Logout: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const Loader = () => (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
    </View>
);

const AppNavigator = () => {
    const [ready, setReady] = useState(false);
    const [hasConsentOnce, setHasConsentOnce] = useState(false);
    const [hasToken, setHasToken] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const consent = await AsyncStorage.getItem('consent_given_once');
                setHasConsentOnce(consent === '1');

                const token = await AsyncStorage.getItem('@auth_token');
                if (!token) {
                    setHasToken(false);
                    return;
                }
                try {
                    await api.get('/auth/me');
                    setHasToken(true);
                } catch {
                    await AsyncStorage.removeItem('@auth_token');
                    setHasToken(false);
                }
            } finally {
                setReady(true);
            }
        })();
    }, []);

    if (!ready) {
        return <Loader />;
    }
    const initialRouteName: keyof RootStackParamList = hasConsentOnce
        ? hasToken
            ? 'Home'
            : 'Login'
        : 'InfoSplash';
    const showInfoSplash = !hasConsentOnce;
    const showSplashTwo = !hasConsentOnce;

    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName={initialRouteName}
                screenOptions={{ headerShown: false }}>
                {showInfoSplash && (
                    <Stack.Screen name="InfoSplash" component={InfoSplash} />
                )}
                {showSplashTwo && (
                    <Stack.Screen name="SplashTwo" component={SplashTwo} />
                )}

                <Stack.Screen name="Login" component={Login} />
                <Stack.Screen name="Register" component={Register} />
                <Stack.Screen name="Home" component={Home} />
                <Stack.Screen name="Logout" component={Logout} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
