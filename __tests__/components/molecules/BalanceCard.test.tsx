import React from 'react';
import { render } from '@testing-library/react-native';
import { BalanceCard } from '../../../components/molecules/BalanceCard';

describe('BalanceCard', () => {
  it('renders balance amount', () => {
    const { getByText } = render(
      <BalanceCard balance={1234.56} currency="USD" />
    );
    // Check that balance is displayed (format may vary)
    expect(getByText(/1,?234/)).toBeTruthy();
  });

  it('renders with custom title', () => {
    const { getByText } = render(
      <BalanceCard balance={100} currency="USD" title="Available Balance" />
    );
    expect(getByText('Available Balance')).toBeTruthy();
  });

  it('handles zero balance', () => {
    const { getByText } = render(
      <BalanceCard balance={0} currency="USD" />
    );
    expect(getByText(/0/)).toBeTruthy();
  });

  it('applies accessibility label', () => {
    const { getByLabelText } = render(
      <BalanceCard 
        balance={500} 
        currency="USD" 
        accessibilityLabel="Your current balance is 500 dollars"
      />
    );
    expect(getByLabelText('Your current balance is 500 dollars')).toBeTruthy();
  });
});
