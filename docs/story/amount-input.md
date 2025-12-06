## AmountInput

The `AmountInput` molecule provides the investment-style numeric keypad seen in the design reference. It is intentionally opinionated so the same component can power funding, investing, and withdrawal flows without rebuilding the keypad logic each time.

### Example

```tsx
import React, { useState } from 'react';
import { AmountInput } from '@/components';

export const Example = () => {
  const [amount, setAmount] = useState('0');

  return (
    <AmountInput
      title="Invest in basket"
      sourceLabel="Paying from"
      sourceValue="43fgX...K6Mj0"
      minLabel="Min investment"
      minValue="$15.25"
      value={amount}
      onValueChange={setAmount}
      helperText="= 2.0383 SGT-3402"
      availableBalanceLabel="Avail. Bal."
      availableBalanceValue="1890.18 USDC"
      onMaxPress={() => setAmount('1890.18')}
      onContinue={() => console.log('Continue with', amount)}
      errorText={
        parseFloat(amount || '0') > 1890.18
          ? 'Insufficient balance'
          : undefined
      }
    />
  );
};
```

### Key Props

- `value` / `onValueChange` – Control the amount string or allow the component to manage it with `defaultValue`.
- `status` and `errorText` – Drive the color states (`empty`, `default`, `error`) and messaging.
- `maxDigits` / `maxDecimals` – Clamp input length without extra bookkeeping in screens.
- `keypadLayout` – Override the keypad if a different layout is required.
- `onContinue` – Receives the latest amount when the primary action button is pressed.
