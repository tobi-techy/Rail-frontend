// Base component props
export interface BaseComponentProps {
  className?: string;
  testID?: string;
}

// Button component types
export interface ButtonProps extends BaseComponentProps {
  title: string;
  variant?: 'primary' | 'accent' | 'tertiary' | 'fab';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  onPress?: () => void;
}

// Input component types
export interface InputFieldProps extends BaseComponentProps {
  label: string;
  value?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'phone';
  icon?: string;
  onChangeText?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

// Card component types
export interface CardProps extends BaseComponentProps {
  variant?: 'default' | 'quest' | 'metric' | 'list-item' | 'virtual-card' | 'collateral';
  title?: string;
  subtitle?: string;
  content?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}

// Icon component types
export interface IconProps extends BaseComponentProps {
  name: string;
  size?: number;
  color?: string;
}

// Progress component types
export interface ProgressBarProps extends BaseComponentProps {
  progress: number; // 0-100
  variant?: 'default' | 'battle-pass';
  showLabel?: boolean;
  label?: string;
}

// Modal component types
export interface ModalProps extends BaseComponentProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  children: React.ReactNode;
}

// Navigation component types
export interface HeaderProps extends BaseComponentProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
}

// Molecular component types
export interface FeatureCardProps extends BaseComponentProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface BalanceCardProps extends BaseComponentProps {
  balance: string;
  currency?: string;
  onTopUpPress?: () => void;
}

export interface TextLinkProps extends BaseComponentProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'small' | 'medium' | 'large';
  underline?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

export interface IllustrationProps extends BaseComponentProps {
  type: 'welcome' | 'gift' | 'custom';
  size?: 'small' | 'medium' | 'large';
  children?: React.ReactNode;
}

export interface TabBarProps extends BaseComponentProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (tabId: string) => void;
}

export interface TabItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

// Design system types
export interface DesignTokens {
  colors: {
    primary: string;
    accent: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      onPrimary: string;
      onAccent: string;
    };
    semantic: {
      success: string;
      warning: string;
      danger: string;
      info: string;
    };
  };
  typography: {
    fonts: {
      primary: string;
      secondary: string;
    };
    sizes: {
      h1: number;
      h2: number;
      h3: number;
      body: number;
      label: number;
      caption: number;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}