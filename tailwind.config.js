/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B84FF',
          accent: '#1B84FF',
          secondary: '#487984',
        },
        background: {
          DEFAULT: '#FFFFFF',
          main: '#FFFFFF',
          surface: '#F5F5F5',
        },
        surface: '#F5F5F5',
        text: {
          primary: '#121212',
          secondary: '#757575',
        },
        success: '#00C853',
        destructive: '#F44336',
        overlay: 'rgba(0, 0, 0, 0.7)',
      },
      fontFamily: {
        // Headings - Pramukh Rounded (secondary)
        display: ['PramukhRounded-Bold'],
        headline: ['PramukhRounded-Bold'],
        'headline-2': ['PramukhRounded-Semibold'],
        // Body/UI - SF Pro Rounded (primary)
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
        subtitle: ['18px', { lineHeight: '1.4' }],
        body: ['16px', { lineHeight: '1.5' }],
        caption: ['14px', { lineHeight: '1.5' }],
        'button-lg': ['18px', { lineHeight: '1.1' }],
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
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};
