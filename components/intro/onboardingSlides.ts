import { onBoard1, onBoard2, onBoard3 } from '@/assets/images';
import { ImageSourcePropType } from 'react-native';

export interface OnboardingSlide {
  key: string;
  title: string;
  subtitle: string;
  description: string;
  image: ImageSourcePropType;
  showMiriam?: boolean;
}

export const onboardingSlides: OnboardingSlide[] = [
  {
    key: '1',
    title: 'Receive across borders.',
    subtitle: 'Named accounts and crypto, in one place.',
    description: 'Get paid in. Spend what’s left. Verify only when you need bank details.',
    image: onBoard1,
  },
  {
    key: '2',
    title: 'What arrives is already split.',
    subtitle: 'You don’t have to figure it out.',
    description: 'A portion is locked the moment money lands. The rest is safe to spend.',
    image: onBoard2,
  },
  {
    key: '3',
    title: 'Ask Miriam.',
    subtitle: 'She handles the next step.',
    description: 'Funding, sending, or verifying — one question at a time.',
    image: onBoard3,
    showMiriam: true,
  },
];

export const SLIDE_INTERVAL = 6000;
