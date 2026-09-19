/**
 * @format
 */

import 'react-native';
import React from 'react';
import {Text, TextInput} from 'react-native';
import {disableSystemFontScaling} from '../src/utils/fontScaling';

// Note: import explicitly to use the types shipped with jest.
import {it, expect} from '@jest/globals';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

disableSystemFontScaling();

it('disables font scaling on Text by default', () => {
  const tree = renderer.create(<Text>Hello</Text>).root;
  const text = tree.findByType(Text);
  expect(text.props.allowFontScaling).toBe(false);
});

it('disables font scaling on TextInput by default', () => {
  const tree = renderer.create(<TextInput />).root;
  const input = tree.findByType(TextInput);
  expect(input.props.allowFontScaling).toBe(false);
});
