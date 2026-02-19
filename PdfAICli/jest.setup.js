/**
 * Jest setup - React Native test ortamı için mock'lar
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-document-picker', () => ({
  pick: jest.fn(() => Promise.resolve({})),
  types: { pdf: 'application/pdf' },
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
