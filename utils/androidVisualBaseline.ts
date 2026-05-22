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
  StatusBar.setBackgroundColor('#FFFFFF', true);
  void SystemUI.setBackgroundColorAsync('#FFFFFF');

  const androidTextStyle = {
    includeFontPadding: false,
    fontFamily: FONT_FAMILIES.SF_PRO_DISPLAY.REGULAR,
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
