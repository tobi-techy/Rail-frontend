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
    title: 'Your money shouldn’t depend on willpower.',
    subtitle: 'Rail acts the moment money arrives.',
    description: 'A portion is locked in instantly. You don’t get the chance to spend it first.',
    image: onBoard1,
  },
  {
    key: '2',
    title: 'Your balance is already split.',
    subtitle: 'You don’t have to figure it out.',
    description: 'What’s left is safe to spend. Everything else is taken care of.',
    image: onBoard2,
  },
  {
    key: '3',
    title: 'Wealth builds without your attention.',
    subtitle: 'In the background. Always on.',
    description: 'The part you don’t touch keeps working while you live normally.',
    image: onBoard3,
  },
  {
    key: '4',
    title: 'This is how progress should work.',
    subtitle: 'Automatic. Relentless.',
    description: 'No habits. No discipline. Just a system that moves you forward.',
    image: onBoard4,
  },
];

export const SLIDE_INTERVAL = 6000;
