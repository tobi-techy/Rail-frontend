import { withLayoutContext } from 'expo-router';
import { ParamListBase, StackNavigationState } from '@react-navigation/native';
import {
  createBlankStackNavigator,
  type BlankStackNavigationOptions,
  type BlankStackNavigationEventMap,
} from 'react-native-screen-transitions/blank-stack';

const { Navigator } = createBlankStackNavigator();

export const Stack = withLayoutContext<
  BlankStackNavigationOptions,
  typeof Navigator,
  StackNavigationState<ParamListBase>,
  BlankStackNavigationEventMap
>(Navigator);
