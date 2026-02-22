import React, { useEffect, useState } from 'react';
import { View, Platform, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useT } from '../store/useLocaleStore';
import { useAnalysisLoadingStore } from '../store/useAnalysisLoadingStore';
import { NavigationContainer } from '@react-navigation/native';
import LoadingModal from '../components/Modals/LoadingModal';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile } from '../server/api/User';
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

const TAB_BAR_CONTENT_HEIGHT = 72;
const HOME_INDICATOR_HEIGHT_IOS = 34;

const tabIcons: Record<string, { active: string; inactive: string }> = {
    Analiz: { active: 'document-text', inactive: 'document-text-outline' },
    Geçmiş: { active: 'time', inactive: 'time-outline' },
    Profil: { active: 'person', inactive: 'person-outline' },
};

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    const insets = useSafeAreaInsets();
    const bottomSafe = Platform.OS === 'ios'
        ? Math.max(insets.bottom, HOME_INDICATOR_HEIGHT_IOS)
        : Math.max(insets.bottom, 12);
    const tabBarHeight = TAB_BAR_CONTENT_HEIGHT + bottomSafe;

    return (
        <View style={[tabBarStyles.wrapper, { paddingBottom: bottomSafe }]}>
            <View style={[tabBarStyles.container, { minHeight: TAB_BAR_CONTENT_HEIGHT }]}>
                <View style={tabBarStyles.row}>
                    {state.routes.map((route, index) => {
                        const { options } = descriptors[route.key];
                        const focused = state.index === index;
                        const label = options.title ?? route.name;
                        const iconSet = tabIcons[route.name] ?? { active: 'ellipse-outline', inactive: 'ellipse-outline' };

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });
                            if (!event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                        };

                        return (
                            <TouchableOpacity
                                key={route.key}
                                accessibilityRole="button"
                                accessibilityLabel={label}
                                accessibilityState={focused ? { selected: true } : {}}
                                onPress={onPress}
                                activeOpacity={0.7}
                                style={tabBarStyles.tabItem}>
                                <View style={tabBarStyles.iconWrap}>
                                    <Ionicons
                                        name={focused ? iconSet.active : iconSet.inactive}
                                        size={26}
                                        color={focused ? colors.backgroundPurple : '#A1A1AA'}
                                    />
                                    {focused ? <View style={tabBarStyles.indicator} /> : null}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </View>
    );
};

const tabBarStyles = StyleSheet.create({
    wrapper: {
        paddingHorizontal: 0,
        paddingTop: 0,
        alignItems: 'stretch',
        justifyContent: 'flex-end',
    },
    container: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(0,0,0,0.08)',
        paddingVertical: 14,
        paddingHorizontal: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
    },
    row: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconWrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    indicator: {
        width: 24,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: colors.backgroundPurple,
        marginTop: 6,
    },
});

const MainTabs = () => {
    const t = useT();
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: { display: 'none' },
            }}>
            <Tab.Screen name="Analiz" component={Home} options={{ title: t('tabs.analysis') }} />
            <Tab.Screen name="Geçmiş" component={History} options={{ title: t('tabs.history') }} />
            <Tab.Screen name="Profil" component={ProfileTab} options={{ title: t('tabs.profile') }} />
        </Tab.Navigator>
    );
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
    loaderContainer: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    loaderLottie: {
        width: 200,
        height: 200,
    },
});

const Loader = () => (
    <View style={styles.loaderContainer}>
        <LottieView
            source={require('../assets/splash/LoadingAnimation.json')}
            autoPlay
            loop
            style={styles.loaderLottie}
        />
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
