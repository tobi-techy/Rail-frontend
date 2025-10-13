/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // New brand color palette
        'brand-magenta': '#FB088F',
        'brand-pink': '#F39ABE',
        'brand-lavender': '#949FFF',
        'brand-dark': '#1E1A3E',
        'brand-dark-blue': '#1E1F4B',
        'brand-lime': '#D4FF00',
        'brand-soft-green': '#ADF48C',
        'brand-light-bg': '#EAE8FF',
      },
      fontFamily: {
        // Boldonse font (primary display font)
        'boldonse': ['Boldonse-Regular'],
        'boldonse-regular': ['Boldonse-Regular'],

        // SF Pro Rounded font variants (body text and UI)
        'sf-pro-ultralight': ['SF-Pro-Rounded-Ultralight'],
        'sf-pro-thin': ['SF-Pro-Rounded-Thin'],
        'sf-pro-light': ['SF-Pro-Rounded-Light'],
        'sf-pro-regular': ['SF-Pro-Rounded-Regular'],
        'sf-pro-medium': ['SF-Pro-Rounded-Medium'],
        'sf-pro-semibold': ['SF-Pro-Rounded-Semibold'],
        'sf-pro-bold': ['SF-Pro-Rounded-Bold'],
        'sf-pro-heavy': ['SF-Pro-Rounded-Heavy'],
        'sf-pro-black': ['SF-Pro-Rounded-Black'],

        // Semantic font aliases - updated to use Boldonse for display
        heading: ['Boldonse-Regular'],
        'heading-light': ['Boldonse-Regular'],
        body: ['SF-Pro-Rounded-Regular'],
        'body-light': ['SF-Pro-Rounded-Light'],
        'body-medium': ['SF-Pro-Rounded-Medium'],
        'body-bold': ['SF-Pro-Rounded-Bold'],
        caption: ['SF-Pro-Rounded-Medium'],
        display: ['Boldonse-Regular'],
        'display-artistic': ['Boldonse-Regular'],

        // Legacy MDNichrome aliases (deprecated - use Boldonse instead)
        'mdnichrome-thin': ['MDNichromeTest-ThinOblique'],
        'mdnichrome-light': ['MDNichromeTest-LightOblique'],
        'mdnichrome-regular': ['MDNichromeTest-RegularOblique'],
        'mdnichrome-infra': ['MDNichromeTest-InfraOblique'],
        'mdnichrome-dark': ['MDNichromeTest-DarkOblique'],
        'mdnichrome-bold': ['MDNichromeTest-BoldOblique'],
        'mdnichrome-black': ['MDNichromeTest-BlackOblique'],
        'mdnichrome-ultra': ['MDNichromeTest-UltraOblique'],
      },
    },
  },
  plugins: [],
};
