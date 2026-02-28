import { onBoard1, onBoard2, onBoard3, onBoard4 } from '@/assets/images';
import type { VideoSource } from 'expo-video';

export interface OnboardingSlide {
  key: string;
  marker: string;
  title: string;
  subtitle: string;
  description: string;
  asciiLines: [string, string, string];
  video: VideoSource;
}

export const onboardingSlides: OnboardingSlide[] = [
  {
    key: '1',
    marker: '[ rail://boot_01 ]',
    title: 'Start small, build real momentum.',
    subtitle: 'Every dollar gets routed with intention.',
    description: 'Automate deposits, keep it simple, and stay consistent from day one.',
    asciiLines: [
      '+--------------------------+',
      '| init -> save -> invest   |',
      '+--------------------------+',
    ],
    video: onBoard1,
  },
  {
    key: '2',
    marker: '[ rail://boot_02 ]',
    title: 'Move cash in within seconds.',
    subtitle: 'Zero friction funding flow.',
    description: 'Link your bank once and keep the pipeline active without leaving the app.',
    asciiLines: [
      '+--------------------------+',
      '| bank => rail => wallet   |',
      '+--------------------------+',
    ],
    video: onBoard2,
  },
  {
    key: '3',
    marker: '[ rail://boot_03 ]',
    title: 'Invest without the noise.',
    subtitle: 'Clear signals, fewer decisions.',
    description: 'A focused flow that helps you keep buying on schedule and ignore market chaos.',
    asciiLines: [
      '+--------------------------+',
      '| signal > noise > repeat  |',
      '+--------------------------+',
    ],
    video: onBoard3,
  },
  {
    key: '4',
    marker: '[ rail://boot_04 ]',
    title: 'Spend. Save. Loop it forever.',
    subtitle: 'A daily system, not a one-time push.',
    description: 'Track motion, lock habits, and make your money behavior feel automatic.',
    asciiLines: [
      '+--------------------------+',
      '| spend -> save -> repeat  |',
      '+--------------------------+',
    ],
    video: onBoard4,
  },
];

export const SLIDE_INTERVAL = 6000;
