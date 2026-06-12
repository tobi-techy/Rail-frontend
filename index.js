import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';

import 'expo-router/entry';

if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}
