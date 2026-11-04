import { createNavigationContainerRef } from '@react-navigation/native';

/** Kök stack — AppNavigator ile aynı route adları */
export type RootStackParamList = {
    LanguageSplash: undefined;
    InfoSplash: undefined;
    SplashTwo: undefined;
    Login: undefined;
    Register: undefined;
    ForgotPassword: undefined;
    ResetPassword: { token?: string; email?: string; devCode?: string };
    MainTabs: undefined;
    Settings: undefined;
    PrivacyPolicy: undefined;
    Logout: undefined;
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** Login ekranına kök stack'i sıfırla (tab/stack geçmişini temizler). */
export function resetToLogin() {
    if (!navigationRef.isReady()) {
        return;
    }
    navigationRef.resetRoot({
        index: 0,
        routes: [{ name: 'Login' }],
    });
}

export function navigateToSettings() {
    if (!navigationRef.isReady()) {
        return;
    }
    navigationRef.navigate('Settings');
}

export function navigateToHelpSupport() {
    if (!navigationRef.isReady()) {
        return;
    }
    // Tab içi Profile stack — alt menü görünür kalsın
    (navigationRef.navigate as (name: string, params?: object) => void)(
        'MainTabs',
        {
            screen: 'Profil',
            params: { screen: 'HelpSupport' },
        },
    );
}
