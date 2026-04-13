import { onBoard1, onBoard2, onBoard3, onBoard4 } from '@/assets/images';
import { ImageSourcePropType } from 'react-native';

export interface OnboardingSlide {
  key: string;
  title: string;
  subtitle: string;
  description: string;
  image: ImageSourcePropType;
}

export const onboardingSlides: OnboardingSlide[] = [
  {
    key: '1',
    title: 'Stop deciding what to do with your money.',
    subtitle: 'Money comes in. Rail handles the rest.',
    description: 'No more choosing how much to save. A portion is set aside automatically every time.',
    image: onBoard1,
  },
  {
    key: '2',
    title: 'Spend what’s left, stress-free.',
    subtitle: 'Your money is already split.',
    description: 'What you see is safe to spend. No mental math, no second guessing.',
    image: onBoard2,
  },
  {
    key: '3',
    title: 'Earn quietly in the background.',
    subtitle: 'No extra steps required.',
    description: 'The portion set aside keeps working for you while you use your money normally.',
    image: onBoard3,
  },
  {
    key: '4',
    title: 'Progress happens automatically.',
    subtitle: 'Not a habit. Just how it works.',
    description: 'You don’t need discipline when your system is already set up.',
    image: onBoard4,
  },
];

export const SLIDE_INTERVAL = 6000;
