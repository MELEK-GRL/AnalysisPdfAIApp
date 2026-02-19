/**
 * Home ekranı smoke test
 */
import React from 'react';
import renderer from 'react-test-renderer';

jest.mock('react-native-document-picker', () => ({
    pickSingle: jest.fn(),
    types: { pdf: 'application/pdf' },
    isCancel: jest.fn(() => false),
}));
jest.mock('@react-navigation/native', () => ({
    useNavigation: () => ({ navigate: jest.fn() }),
}));
jest.mock('../src/server/api/User', () => ({
    getProfile: jest.fn().mockResolvedValue({ name: 'Test' }),
}));
jest.mock('../src/server/api/Lab', () => ({
    uploadPdf: jest.fn(),
}));
jest.mock('../src/server/api/Analytics', () => ({
    trackButtonClick: jest.fn(),
}));
jest.mock('../src/utils/analytics/useScreenTime', () => jest.fn());
jest.mock('../src/store/useAuthStore', () => ({
    useAuthStore: (fn: (s: any) => any) => fn({ user: { name: 'Test' } }),
}));
jest.mock('../src/store/useLocaleStore', () => ({
    useLocaleStore: (fn?: (s: any) => any) =>
        typeof fn === 'function'
            ? fn({ t: (k: string) => k, locale: 'tr', setLocale: jest.fn() })
            : { t: (k: string) => k, locale: 'tr', setLocale: jest.fn() },
    useT: () => (k: string) => k,
}));
jest.mock('../src/utils/deviceStore/device', () => ({
    useResponsive: () => ({
        w1px: 1,
        h1px: 1,
        fs1px: 1,
    }),
}));

import Home from '../src/screens/Home';

describe('Home', () => {
    it('renders correctly', () => {
        const tree = renderer.create(<Home />).toJSON();
        expect(tree).toBeTruthy();
    });
});
