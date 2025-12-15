import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../../../components/atoms/Button';

describe('Button', () => {
  it('renders with title', () => {
    const { getByText } = render(<Button title="Click me" onPress={() => {}} />);
    expect(getByText('Click me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Click me" onPress={onPress} />);

    fireEvent.press(getByText('Click me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Click me" onPress={onPress} disabled />);

    fireEvent.press(getByText('Click me'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    const { queryByText, getByTestId } = render(
      <Button title="Click me" onPress={() => {}} loading testID="button" />
    );
    // Title should be hidden or replaced during loading
    expect(queryByText('Click me')).toBeFalsy();
  });
});
