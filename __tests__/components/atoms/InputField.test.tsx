import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { InputField } from '../../../components/atoms/InputField';

describe('InputField', () => {
  it('renders with placeholder', () => {
    const { getByPlaceholderText } = render(
      <InputField placeholder="Enter email" onChangeText={() => {}} />
    );
    expect(getByPlaceholderText('Enter email')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <InputField placeholder="Enter text" onChangeText={onChangeText} />
    );

    fireEvent.changeText(getByPlaceholderText('Enter text'), 'hello');
    expect(onChangeText).toHaveBeenCalledWith('hello');
  });

  it('displays error message when provided', () => {
    const { getByText } = render(
      <InputField placeholder="Email" onChangeText={() => {}} error="Invalid email" />
    );
    expect(getByText('Invalid email')).toBeTruthy();
  });

  it('renders label when provided', () => {
    const { getByText } = render(
      <InputField label="Email Address" placeholder="Email" onChangeText={() => {}} />
    );
    expect(getByText('Email Address')).toBeTruthy();
  });

  it('is not editable when disabled', () => {
    const { getByPlaceholderText } = render(
      <InputField placeholder="Disabled" onChangeText={() => {}} editable={false} />
    );
    const input = getByPlaceholderText('Disabled');
    expect(input.props.editable).toBe(false);
  });
});
