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
    title: 'Start small, build real momentum.',
    subtitle: 'Every dollar gets routed with intention.',
    description: 'Automate deposits, keep it simple, and stay consistent from day one.',
    image: onBoard1,
  },
  {
    key: '2',
    title: 'Move cash in within seconds.',
    subtitle: 'Zero friction funding flow.',
    description: 'Link your bank once and keep the pipeline active without leaving the app.',
    image: onBoard2,
  },
  {
    key: '3',
    title: 'Invest without the hassle.',
    subtitle: 'Clear signals, fewer decisions.',
    description: 'A focused flow that helps you keep buying on schedule and ignore market chaos.',
    image: onBoard3,
  },
  {
    key: '4',
    title: 'Spend. Save. Loop it forever.',
    subtitle: 'A daily system, not a one-time push.',
    description: 'Track motion, lock habits, and make your money behavior feel automatic.',
    image: onBoard4,
  },
];

export const SLIDE_INTERVAL = 6000;
