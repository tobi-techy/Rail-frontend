import React from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { SelectionScreen } from '@/components';
import { ROUTES } from '@/constants/routes';
import { useOnboardingComplete } from '@/api/hooks/useOnboarding';
import { useAuthStore } from '@/stores/authStore';
import type { OnboardingCompleteRequest } from '@/api/types';

const EMPLOYMENT_OPTIONS = [
  { id: 'employed', label: 'Employed', desc: 'Full-time or part-time' },
  { id: 'self-employed', label: 'Self-employed', desc: 'Business owner or freelancer' },
  { id: 'student', label: 'Student', desc: 'Currently studying' },
  { id: 'retired', label: 'Retired', desc: 'No longer working' },
  { id: 'unemployed', label: 'Not employed', desc: 'Looking for work' },
];

const mapIncomeRangeToNumber = (incomeRange: string): number | undefined => {
  const incomeMap: Record<string, number> = {
    'under-25k': 25000,
    '25k-50k': 50000,
    '50k-100k': 100000,
    '100k-200k': 200000,
    'over-200k': 250000,
  };

  if (incomeMap[incomeRange]) return incomeMap[incomeRange];

  const parsed = Number.parseInt(incomeRange.replace(/[^\d]/g, ''), 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export default function EmploymentStatus() {
  const registrationData = useAuthStore((state) => state.registrationData);
  const updateRegistrationData = useAuthStore((state) => state.updateRegistrationData);
  const clearRegistrationData = useAuthStore((state) => state.clearRegistrationData);
  const setOnboardingStatus = useAuthStore((state) => state.setOnboardingStatus);
  const { mutate: completeOnboarding, isPending } = useOnboardingComplete();

  const handleCompleteProfile = (selectedEmploymentStatus: string) => {
    const payload: OnboardingCompleteRequest = {
      password: registrationData.password,
      firstName: registrationData.firstName,
      lastName: registrationData.lastName,
      dateOfBirth: registrationData.dob,
      country: registrationData.country,
      address: {
        street: registrationData.street,
        city: registrationData.city,
        state: registrationData.state,
        postalCode: registrationData.postalCode,
        country: registrationData.country,
      },
      phone: registrationData.phone || undefined,
      employmentStatus: selectedEmploymentStatus,
      yearlyIncome: mapIncomeRangeToNumber(registrationData.yearlyIncome),
      userExperience: registrationData.investmentExperience || undefined,
      investmentGoals: registrationData.investmentGoal
        ? [registrationData.investmentGoal]
        : undefined,
    };

    if (!payload.password || payload.password.length < 12) {
      Alert.alert('Missing Password', 'Please create a valid password before continuing');
      router.replace(ROUTES.AUTH.COMPLETE_PROFILE.CREATE_PASSWORD as any);
      return;
    }

    if (
      !payload.firstName ||
      !payload.lastName ||
      !payload.dateOfBirth ||
      !payload.country ||
      !payload.address.street ||
      !payload.address.city ||
      !payload.address.state ||
      !payload.address.postalCode
    ) {
      Alert.alert('Incomplete Profile', 'Please complete all required profile fields');
      router.replace(ROUTES.AUTH.COMPLETE_PROFILE.PERSONAL_INFO as any);
      return;
    }

    updateRegistrationData({ employmentStatus: selectedEmploymentStatus });

    completeOnboarding(payload, {
      onSuccess: (response) => {
        setOnboardingStatus(response.onboarding?.onboardingStatus || 'kyc_pending');
        clearRegistrationData();
        router.replace(ROUTES.AUTH.CREATE_PASSCODE as any);
      },
      onError: (error: any) => {
        Alert.alert('Profile Submission Failed', error?.message || 'Please try again.');
      },
    });
  };

  return (
    <SelectionScreen
      title="Employment"
      subtitle="What's your current status?"
      options={EMPLOYMENT_OPTIONS}
      nextRoute={ROUTES.AUTH.CREATE_PASSCODE}
      buttonTitle="Complete Profile"
      initialSelected={registrationData.employmentStatus}
      buttonLoading={isPending}
      onNext={handleCompleteProfile}
    />
  );
}
