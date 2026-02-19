import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useLocaleStore } from '../store/useLocaleStore';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile } from '../server/api/User';
import { AUTH_TOKEN, CONSENT_GIVEN_ONCE } from '../constants/storageKeys';

import Home from '../screens/Home';
import History from '../screens/History';
import Settings from '../screens/Settings';
import PrivacyPolicy from '../screens/PrivacyPolicy';
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
    MainTabs: undefined;
    Settings: undefined;
    PrivacyPolicy: undefined;
    Logout: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
    const t = useLocaleStore((s) => s.t);
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#6D28D9',
                tabBarInactiveTintColor: '#9CA3AF',
                tabBarLabelStyle: { fontSize: 12 },
            }}>
            <Tab.Screen
                name="Analiz"
                component={Home}
                options={{
                    title: t('tabs.analysis'),
                    tabBarIcon: ({ focused, color, size }) => (
                        <Ionicons
                            name={focused ? 'document-text' : 'document-text-outline'}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="Geçmiş"
                component={History}
                options={{
                    title: t('tabs.history'),
                    tabBarIcon: ({ focused, color, size }) => (
                        <Ionicons
                            name={focused ? 'time' : 'time-outline'}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

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
                const consent = await AsyncStorage.getItem(CONSENT_GIVEN_ONCE);
                setHasConsentOnce(consent === '1');

                const token = await AsyncStorage.getItem(AUTH_TOKEN);
                if (!token) {
                    setHasToken(false);
                    return;
                }
                try {
                    await getProfile();
                    setHasToken(true);
                } catch {
                    await AsyncStorage.removeItem(AUTH_TOKEN);
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
            ? 'MainTabs'
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
                <Stack.Screen name="MainTabs" component={MainTabs} />
                <Stack.Screen name="Settings" component={Settings} />
                <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
                <Stack.Screen name="Logout" component={Logout} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
