import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

const Invest = () => {
  return (
    <KeyboardAwareScrollView
      className="flex-1"
      keyboardShouldPersistTaps="handled"></KeyboardAwareScrollView>
  );
};

export default Invest;
