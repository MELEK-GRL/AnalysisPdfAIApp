/**
 * Jest setup - React Native test ortamı için mock'lar
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@react-native-firebase/analytics', () => {
  const analytics = () => ({
    logEvent: jest.fn(() => Promise.resolve()),
    logScreenView: jest.fn(() => Promise.resolve()),
    logLogin: jest.fn(() => Promise.resolve()),
    setAnalyticsCollectionEnabled: jest.fn(() => Promise.resolve()),
  });
  return { __esModule: true, default: analytics };
});

jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  default: () => ({}),
}));

jest.mock('@react-native-documents/picker', () => ({
  pick: jest.fn(() => Promise.resolve([{}])),
  types: { pdf: 'application/pdf' },
  keepLocalCopy: jest.fn(() =>
    Promise.resolve([{ status: 'success', localUri: 'file:///tmp/t.pdf' }]),
  ),
  isErrorWithCode: jest.fn(() => false),
  errorCodes: { OPERATION_CANCELED: 'OPERATION_CANCELED' },
}));

// Zustand store API: hook(selector), getState, setState, subscribe
jest.mock('./src/store/useDeviceStore', () => {
  const mockState = {
    width: 375,
    height: 812,
    w1px: 1,
    h1px: 1,
    fs1px: 1,
    setDimensions: jest.fn(),
  };
  const fn = (selector) =>
    typeof selector === 'function' ? selector(mockState) : mockState;
  fn.getState = () => mockState;
  fn.setState = jest.fn();
  fn.subscribe = jest.fn();
  return { __esModule: true, default: fn };
});
