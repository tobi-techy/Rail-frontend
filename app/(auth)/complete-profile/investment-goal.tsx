import React from 'react';
import { SelectionScreen } from '@/components';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores/authStore';

const GOALS = [
  { id: 'grow-wealth', label: 'Grow my wealth', desc: 'Long-term investing' },
  { id: 'save-goal', label: 'Save for a goal', desc: 'House, car, vacation' },
  { id: 'retirement', label: 'Plan for retirement', desc: 'Build a nest egg' },
  { id: 'passive-income', label: 'Generate passive income', desc: 'Dividends & interest' },
  { id: 'learn', label: 'Learn to invest', desc: 'Start my journey' },
];

export default function InvestmentGoal() {
  const registrationData = useAuthStore((state) => state.registrationData);
  const updateRegistrationData = useAuthStore((state) => state.updateRegistrationData);

  return (
    <SelectionScreen
      title="Investment Goal"
      subtitle="What's your primary goal?"
      options={GOALS}
      nextRoute={ROUTES.AUTH.COMPLETE_PROFILE.INVESTMENT_EXPERIENCE}
      initialSelected={registrationData.investmentGoal}
      onNext={(selectedId) => {
        updateRegistrationData({ investmentGoal: selectedId });
      }}
    />
  );
}
