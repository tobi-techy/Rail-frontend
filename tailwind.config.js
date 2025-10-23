/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: {
          magenta: '#FB088F',
          pink: '#F39ABE',
          lavender: '#949FFF',
          dark: '#1E1A3E',
          'dark-blue': '#1E1F4B',
        },
        // Accent colors
        accent: {
          'lime-green': '#D4FF00',
          'soft-green': '#ADF48C',
        },
        // Background colors
        background: {
          main: '#FFFFFF',
          light: '#EAE8FF',
          dark: '#1E1A3E',
        },
        // Surface colors
        surface: {
          card: '#F7F7F7',
          light: '#EAE8FF',
        },
        // Text colors
        text: {
          primary: '#1E1A3E',
          secondary: '#1E1F4B',
          tertiary: '#949FFF',
          'on-primary': '#FFFFFF',
          'on-accent': '#1E1A3E',
        },
        // Semantic colors
        semantic: {
          success: '#ADF48C',
          danger: '#FB088F',
          warning: '#D4FF00',
        },
        // Border colors
        border: {
          primary: '#EAE8FF',
          secondary: '#949FFF',
          tertiary: '#F7F7F7',
        },
        overlay: 'rgba(30, 26, 62, 0.5)',
      },
      fontFamily: {
        // Primary fonts
        primary: ['SF-Pro-Rounded-Bold'],
        secondary: ['SF-Pro-Rounded-Regular'],
        
        // Display and heading fonts
        display: ['Boldonse-Regular'],
        heading: ['Boldonse-Regular'],
        subheading: ['SF-Pro-Rounded-Semibold'],
        
        // Body text variants
        body: ['SF-Pro-Rounded-Regular'],
        'body-bold': ['SF-Pro-Rounded-Bold'],
        'body-semibold': ['SF-Pro-Rounded-Semibold'],
        'body-medium': ['SF-Pro-Rounded-Medium'],
        'body-light': ['SF-Pro-Rounded-Light'],
        
        // UI text variants
        caption: ['SF-Pro-Rounded-Regular'],
        label: ['SF-Pro-Rounded-Medium'],
      },
      fontSize: {
        h1: ['36px', { lineHeight: '1.2' }],
        h2: ['24px', { lineHeight: '1.2' }],
        h3: ['18px', { lineHeight: '1.2' }],
        body: ['16px', { lineHeight: '1.4' }],
        label: ['12px', { lineHeight: '1.4' }],
        caption: ['12px', { lineHeight: '1.4' }],
      },
      fontWeight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      lineHeight: {
        tight: '1.2',
        normal: '1.4',
        relaxed: '1.6',
      },
      spacing: {
        xs: '4px',  // 0.5 * 8px
        sm: '8px',  // 1 * 8px
        md: '16px', // 2 * 8px (elementSpacing)
        lg: '24px', // 3 * 8px (containerPadding)
        xl: '32px', // 4 * 8px
        '2xl': '48px', // 6 * 8px
        '3xl': '64px', // 8 * 8px
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',    // Button corner radius
        xl: '16px',    // Quest card corner radius
        '2xl': '20px', // Default corner radius
        modal: '24px', // Modal corner radius
        fab: '28px',   // FAB corner radius
        full: '9999px',
      },
      container: {
        padding: '24px', // containerPadding from design tokens
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.1)',
        md: '0 2px 4px 0 rgba(0, 0, 0, 0.15)',
        lg: '0 4px 8px 0 rgba(0, 0, 0, 0.2)',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '350ms',
      },
      screens: {
        sm: '375px', // Small phones
        md: '414px', // Large phones
        lg: '768px', // Tablets
        xl: '1024px', // Large tablets
      },
    },
  },
  plugins: [],
};
