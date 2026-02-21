import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useT } from '../store/useLocaleStore';
import { useAnalysisLoadingStore } from '../store/useAnalysisLoadingStore';
import { NavigationContainer } from '@react-navigation/native';
import LoadingModal from '../components/Modals/LoadingModal';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile } from '../server/api/User';
import { fontSize } from '../constants/typography';
import { iconSize } from '../constants/icons';
import { AUTH_TOKEN, CONSENT_GIVEN_ONCE, LANGUAGE_SPLASH_SEEN } from '../constants/storageKeys';
import { useAuthStore } from '../store/useAuthStore';
import colors from '../theme/colors';

import Home from '../screens/Home';
import History from '../screens/History';
import Profile from '../screens/Profile';
import Settings from '../screens/Settings';
import PrivacyPolicy from '../screens/PrivacyPolicy';
import Register from '../screens/Register';
import Login from '../screens/Login';
import ForgotPassword from '../screens/ForgotPassword';
import ResetPassword from '../screens/ResetPassword';
import LanguageSplash from '../screens/Splashs/LanguageSplash';
import InfoSplash from '../screens/Splashs/InfoSplash';
import SplashTwo from '../screens/SplashTwo/SplashTwo';
import Logout from '../screens/Logout';

export type RootStackParamList = {
    LanguageSplash: undefined;
    InfoSplash: undefined;
    SplashTwo: undefined;
    Login: undefined;
    Register: undefined;
    ForgotPassword: undefined;
    ResetPassword: { token?: string; email?: string };
    MainTabs: undefined;
    Settings: undefined;
    PrivacyPolicy: undefined;
    Logout: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const ProfileTab = () => <Profile />;

const TAB_BAR_CONTENT_HEIGHT = 60;
const HOME_INDICATOR_HEIGHT_IOS = 34;

const MainTabs = () => {
    const t = useT();
    const insets = useSafeAreaInsets();
    const bottomSafe = Platform.OS === 'ios'
        ? Math.max(insets.bottom, HOME_INDICATOR_HEIGHT_IOS)
        : Math.max(insets.bottom, 12);
    const tabBarHeight = TAB_BAR_CONTENT_HEIGHT + bottomSafe;

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.backgroundPurple,
                tabBarInactiveTintColor: '#6B7280',
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: 'rgba(0,0,0,0.08)',
                    height: tabBarHeight,
                    paddingTop: 18,
                    paddingBottom: bottomSafe,
                    elevation: 0,
                    shadowColor: 'transparent',
                },
                tabBarItemStyle: {
                    paddingVertical: 6,
                },
                tabBarIconStyle: {
                    marginBottom: 12,
                },
                tabBarShowLabel: true,
            }}>
            <Tab.Screen
                name="Analiz"
                component={Home}
                options={{
                    title: t('tabs.analysis'),
                    tabBarIcon: ({ focused, color }) => (
                        <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                            <Ionicons
                                name={focused ? 'document-text' : 'document-text-outline'}
                                size={26}
                                color={color}
                            />
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Geçmiş"
                component={History}
                options={{
                    title: t('tabs.history'),
                    tabBarIcon: ({ focused, color }) => (
                        <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                            <Ionicons
                                name={focused ? 'time' : 'time-outline'}
                                size={26}
                                color={color}
                            />
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Profil"
                component={ProfileTab}
                options={{
                    title: t('tabs.profile'),
                    tabBarIcon: ({ focused, color }) => (
                        <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                            <Ionicons
                                name={focused ? 'person' : 'person-outline'}
                                size={26}
                                color={color}
                            />
                        </View>
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
    const [hasSeenLanguageSplash, setHasSeenLanguageSplash] = useState(false);
    const [hasConsentOnce, setHasConsentOnce] = useState(false);
    const [hasToken, setHasToken] = useState(false);
    const storeToken = useAuthStore((s) => s.token);
    const analysisLoading = useAnalysisLoadingStore((s) => s.loading);

    useEffect(() => {
        (async () => {
            try {
                const [langSeen, consent, token] = await Promise.all([
                    AsyncStorage.getItem(LANGUAGE_SPLASH_SEEN),
                    AsyncStorage.getItem(CONSENT_GIVEN_ONCE),
                    AsyncStorage.getItem(AUTH_TOKEN),
                ]);
                setHasSeenLanguageSplash(langSeen === '1');
                setHasConsentOnce(consent === '1');

                if (!token) {
                    setHasToken(false);
                } else {
                    try {
                        await getProfile();
                        setHasToken(true);
                    } catch {
                        const { logout: doLogout } = useAuthStore.getState();
                        await doLogout();
                        setHasToken(false);
                    }
                }
            } finally {
                setReady(true);
            }
        })();
    }, []);

    if (!ready) {
        return <Loader />;
    }
    // İlk açılışta önce splash akışı (dil → bilgi → onay), sonra login/token
    const initialRouteName: keyof RootStackParamList = !hasSeenLanguageSplash
        ? 'LanguageSplash'
        : !hasConsentOnce
          ? 'InfoSplash'
          : hasToken
            ? 'MainTabs'
            : 'Login';

    const linking = {
        prefixes: ['pdfai://'],
        config: {
            screens: {
                ResetPassword: {
                    path: 'reset-password',
                },
            },
        },
    };

    return (
        <>
            <NavigationContainer linking={linking}>
                <Stack.Navigator
                    key={storeToken ?? 'logged-out'}
                    initialRouteName={initialRouteName}
                    screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="LanguageSplash" component={LanguageSplash} />
                    <Stack.Screen name="InfoSplash" component={InfoSplash} />
                    <Stack.Screen name="SplashTwo" component={SplashTwo} />
                    <Stack.Screen name="Login" component={Login} />
                    <Stack.Screen name="Register" component={Register} />
                    <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
                    <Stack.Screen name="ResetPassword" component={ResetPassword} />
                    <Stack.Screen name="MainTabs" component={MainTabs} />
                    <Stack.Screen name="Settings" component={Settings} />
                    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
                    <Stack.Screen name="Logout" component={Logout} />
                </Stack.Navigator>
            </NavigationContainer>
            <LoadingModal visible={analysisLoading} />
        </>
    );
};

export default AppNavigator;
