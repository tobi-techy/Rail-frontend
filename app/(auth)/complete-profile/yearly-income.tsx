import React from 'react';
import { SelectionScreen } from '@/components';
import { ROUTES } from '@/constants/routes';

const INCOME_RANGES = [
  { id: 'under-25k', label: 'Under $25,000' },
  { id: '25k-50k', label: '$25,000 - $50,000' },
  { id: '50k-100k', label: '$50,000 - $100,000' },
  { id: '100k-200k', label: '$100,000 - $200,000' },
  { id: 'over-200k', label: 'Over $200,000' },
];

export default function YearlyIncome() {
  return (
    <SelectionScreen
      title="Yearly Income"
      subtitle="What's your annual income?"
      options={INCOME_RANGES}
      nextRoute={ROUTES.AUTH.COMPLETE_PROFILE.EMPLOYMENT_STATUS}
    />
  );
}
