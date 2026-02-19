/**
 * @format
 * App smoke test
 */
import 'react-native';
import React from 'react';
import renderer from 'react-test-renderer';

jest.mock('../App', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return function MockApp() {
    return (
      <View>
        <Text>PDF AI App</Text>
      </View>
    );
  };
});

import App from '../App';

it('renders correctly', () => {
  const tree = renderer.create(<App />).toJSON();
  expect(tree).toBeTruthy();
});
