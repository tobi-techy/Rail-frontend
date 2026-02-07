import React from 'react';
import { SelectionScreen } from '@/components';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores/authStore';

const EXPERIENCE_LEVELS = [
  { id: 'none', label: 'No experience', desc: "I'm completely new to investing" },
  { id: 'beginner', label: 'Beginner', desc: "I've made a few investments" },
  { id: 'intermediate', label: 'Intermediate', desc: 'I invest regularly' },
  { id: 'advanced', label: 'Advanced', desc: "I'm an experienced investor" },
];

export default function InvestmentExperience() {
  const registrationData = useAuthStore((state) => state.registrationData);
  const updateRegistrationData = useAuthStore((state) => state.updateRegistrationData);

  return (
    <SelectionScreen
      title="Experience"
      subtitle="How experienced are you?"
      options={EXPERIENCE_LEVELS}
      nextRoute={ROUTES.AUTH.COMPLETE_PROFILE.YEARLY_INCOME}
      initialSelected={registrationData.investmentExperience}
      onNext={(selectedId) => {
        updateRegistrationData({ investmentExperience: selectedId });
      }}
    />
  );
}
