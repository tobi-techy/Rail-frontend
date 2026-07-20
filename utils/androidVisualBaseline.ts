import { Platform, StatusBar, Text, TextInput } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { FONT_FAMILIES } from '@/constants/fonts';

type DefaultPropsTarget = {
  defaultProps?: {
    style?: unknown;
    [key: string]: unknown;
  };
};

let didConfigure = false;

export function configureAndroidVisualBaseline() {
  if (didConfigure || Platform.OS !== 'android') return;
  didConfigure = true;

  StatusBar.setBarStyle('dark-content');
  StatusBar.setBackgroundColor('#f7f4ef', true);
  void SystemUI.setBackgroundColorAsync('#f7f4ef');

  const androidTextStyle = {
    includeFontPadding: false,
    fontFamily: FONT_FAMILIES.SATOSHI.REGULAR,
  };

  const text = Text as unknown as DefaultPropsTarget;
  text.defaultProps = {
    ...text.defaultProps,
    style: [androidTextStyle, text.defaultProps?.style],
  };

  const textInput = TextInput as unknown as DefaultPropsTarget;
  textInput.defaultProps = {
    ...textInput.defaultProps,
    style: [androidTextStyle, textInput.defaultProps?.style],
  };
}
