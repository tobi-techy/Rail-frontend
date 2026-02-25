/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF2E01',
          accent: '#FF2E01',
          dark: '#E02900',
          secondary: '#00C853',
          tertiary: '#FF2E01',
        },
        background: {
          DEFAULT: '#FFFFFF',
          main: '#FFFFFF',
          surface: '#F5F5F5',
        },
        surface: '#F5F5F5',
        text: {
          primary: '#000000',
          secondary: '#757575',
          tertiary: '#9CA3AF',
          inverse: '#FFFFFF',
        },
        success: '#00C853',
        destructive: '#FF2E01',
        overlay: 'rgba(0, 0, 0, 0.7)',
        // Dark mode palette (foundation — not wired to screens yet)
        dark: {
          bg: '#000000',
          surface: '#1C1C1E',
          'surface-elevated': '#2C2C2E',
          text: '#FFFFFF',
          'text-secondary': '#8E8E93',
          separator: '#38383A',
        },
      },
      fontFamily: {
        display: ['SF-Pro-Rounded-Bold'],
        headline: ['SF-Pro-Rounded-Bold'],
        'headline-2': ['SF-Pro-Rounded-Semibold'],
        subtitle: ['SF-Pro-Rounded-Bold'],
        body: ['SF-Pro-Rounded-Medium'],
        caption: ['SF-Pro-Rounded-Regular'],
        button: ['SF-Pro-Rounded-Semibold'],
        numeric: ['SF-Pro-Rounded-Regular'],
      },
      fontSize: {
        'display-lg': ['48px', { lineHeight: '1.1' }],
        'headline-1': ['32px', { lineHeight: '1.2' }],
        'headline-2': ['24px', { lineHeight: '1.3' }],
        'headline-3': ['20px', { lineHeight: '1.3' }],
        subtitle: ['18px', { lineHeight: '1.4' }],
        body: ['16px', { lineHeight: '1.5' }],
        caption: ['14px', { lineHeight: '1.5' }],
        small: ['12px', { lineHeight: '1.5' }],
        'button-lg': ['18px', { lineHeight: '1.1' }],
        // Named sizes for previously hardcoded values
        'balance-lg': ['60px', { lineHeight: '1.1' }],
        'balance-sm': ['32px', { lineHeight: '1.1' }],
        'auth-title': ['40px', { lineHeight: '1.1' }],
        keypad: ['30px', { lineHeight: '1.2' }],
        stash: ['26px', { lineHeight: '1.2' }],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
      },
      borderRadius: {
        sm: '8px',
        md: '16px',
        lg: '24px',
      },
      height: {
        keypad: '72px',
        input: '52px',
        'pin-dot': '56px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};
