import React from 'react';
import { SelectionScreen } from '@/components';
import { ROUTES } from '@/constants/routes';

const EMPLOYMENT_OPTIONS = [
  { id: 'employed', label: 'Employed', desc: 'Full-time or part-time' },
  { id: 'self-employed', label: 'Self-employed', desc: 'Business owner or freelancer' },
  { id: 'student', label: 'Student', desc: 'Currently studying' },
  { id: 'retired', label: 'Retired', desc: 'No longer working' },
  { id: 'unemployed', label: 'Not employed', desc: 'Looking for work' },
];

export default function EmploymentStatus() {
  return (
    <SelectionScreen
      title="Employment"
      subtitle="What's your current status?"
      options={EMPLOYMENT_OPTIONS}
      nextRoute={ROUTES.AUTH.CREATE_PASSCODE}
      buttonTitle="Complete Profile"
    />
  );
}
