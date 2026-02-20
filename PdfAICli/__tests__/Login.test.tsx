/**
 * Login ekranı smoke test
 */
import React from 'react';
import renderer from 'react-test-renderer';

jest.mock('@react-navigation/native', () => ({
    useNavigation: () => ({ replace: jest.fn() }),
}));
jest.mock('../src/server/api/User', () => ({
    login: jest.fn(),
}));
jest.mock('../src/server/api/Analytics', () => ({
    trackEvent: jest.fn(),
    trackButtonClick: jest.fn(),
}));
jest.mock('../src/utils/analytics/useScreenTime', () => ({ useScreenTime: jest.fn() }));
jest.mock('../src/store/useAuthStore', () => ({
    useAuthStore: (fn: (s: any) => any) =>
        fn({ setUserAndToken: jest.fn() }),
}));
jest.mock('../src/store/useLocaleStore', () => ({
    useT: () => (k: string) => k,
}));
jest.mock('../src/utils/deviceStore/device', () => ({
    useResponsive: () => ({ w1px: 1, h1px: 1, fs1px: 1 }),
}));

import Login from '../src/screens/Login';

describe('Login', () => {
    it('renders correctly', () => {
        const tree = renderer.create(<Login />).toJSON();
        expect(tree).toBeTruthy();
    });
});
