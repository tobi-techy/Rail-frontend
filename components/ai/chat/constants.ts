import {
  BarChartIcon,
  Calendar03Icon,
  FlashIcon,
  Invoice02Icon,
  Target01Icon,
  Wallet01Icon,
  type PhosphorIcon,
} from '@/lib/icons';
import type { ToneMode } from '@/api/types/ai';

export interface AgentAction {
  label: string;
  subtitle: string;
  icon: PhosphorIcon;
  prompt: string;
  toneMode?: ToneMode;
}

export const AGENT_ACTIONS: AgentAction[] = [
  {
    label: 'Audit',
    subtitle: 'Hard look at leaks',
    icon: BarChartIcon,
    prompt: 'Audit me',
    toneMode: 'hard',
  },
  {
    label: 'Plan',
    subtitle: 'This month setup',
    icon: Wallet01Icon,
    prompt: 'Build my Miriam operating plan for this month',
  },
  {
    label: 'Obligations',
    subtitle: 'Bills and recurring',
    icon: Invoice02Icon,
    prompt: 'Help me add my financial obligations',
  },
  {
    label: 'Automate',
    subtitle: 'Approval-gated rules',
    icon: FlashIcon,
    prompt: 'Help me set up an automation',
  },
  {
    label: 'Forecast',
    subtitle: 'End-of-month view',
    icon: Calendar03Icon,
    prompt: 'Forecast my end-of-month balance',
  },
  {
    label: 'Goals',
    subtitle: 'Pick the next target',
    icon: Target01Icon,
    prompt: 'Help me build a savings plan',
  },
];

export const DEFAULT_SUGGESTIONS = [
  'How am I doing?',
  'Show my balance',
  'What should I focus on?',
  'Audit me',
  'Forecast my end-of-month',
];
