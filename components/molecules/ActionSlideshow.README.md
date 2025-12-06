# ActionSlideshow Component

A professional, smooth-scrolling slideshow component for displaying promotional cards in React Native (Expo). Integrated into `BalanceCard` to showcase actions like identity verification, card applications, and funding options.

## Features

- ✨ **Smooth Scroll Animation**: Scale and opacity transitions for focused slides
- 🎯 **Auto-play**: Automatically cycles through slides with customizable intervals
- 📱 **Touch Responsive**: Pauses on user interaction, resumes after
- 🎨 **Gradient Backgrounds**: Eye-catching linear gradients per slide
- 🔘 **Animated Pagination**: Responsive dot indicators with smooth transitions
- 🎨 **SVG Icon Support**: Uses project SVG assets from `assets/Icons/`
- ♿ **Accessible**: Proper accessibility labels for screen readers

## Installation Requirements

Ensure you have these dependencies installed:

```bash
npx expo install expo-linear-gradient react-native-svg
```

## Component Structure

```
components/
├── atoms/
│   └── SvgIcon.tsx          # SVG icon wrapper component
└── molecules/
    ├── ActionSlideshow.tsx   # Main slideshow component
    ├── BalanceCard.tsx       # Updated with slideshow integration
    └── BalanceCard.example.tsx # Usage examples
```

## Usage

### Basic Usage (with BalanceCard)

```tsx
import { BalanceCard } from '@/components/molecules/BalanceCard';

<BalanceCard
  balance="$12,450.50"
  percentChange="+5.42%"
  buyingPower="$8,500.00"
  onVerifyPress={() => console.log('Navigate to KYC')}
  onGetCardPress={() => console.log('Navigate to card application')}
  onCopyInvestorsPress={() => console.log('Navigate to copy trading')}
  onFundWithCryptoPress={() => console.log('Navigate to crypto funding')}
/>
```

### Standalone Usage

```tsx
import { ActionSlideshow } from '@/components/molecules/ActionSlideshow';

<ActionSlideshow
  autoPlay={true}
  autoPlayInterval={5000}
  slides={[
    {
      id: '1',
      title: 'Verify Your Identity',
      description: 'Complete KYC to unlock full features',
      icon: 'shield-person-6',
      gradient: ['#667EEA', '#764BA2'],
      ctaText: 'Verify Now',
      onPress: handleVerify,
    },
    // More slides...
  ]}
/>
```

### Custom Slides

```tsx
import type { SlideData } from '@/components/molecules/ActionSlideshow';

const customSlides: SlideData[] = [
  {
    id: '1',
    title: 'Your Custom Title',
    description: 'Your custom description',
    icon: 'wallet-3', // Any icon from assets/Icons/
    gradient: ['#4FACFE', '#00F2FE'],
    ctaText: 'Take Action',
    onPress: () => {
      // Your custom action
    },
  },
];

<BalanceCard
  slides={customSlides}
  // ... other props
/>
```

## Props

### ActionSlideshow Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `slides` | `SlideData[]` | Default slides | Array of slide objects |
| `autoPlay` | `boolean` | `true` | Enable/disable auto-play |
| `autoPlayInterval` | `number` | `4000` | Interval in ms between slides |
| `style` | `ViewStyle` | `undefined` | Additional styles |

### SlideData Interface

```typescript
interface SlideData {
  id: string;              // Unique identifier
  title: string;           // Main heading
  description: string;     // Descriptive text
  icon: string;            // Icon name from assets/Icons/
  gradient: string[];      // Array of 2+ gradient colors
  ctaText: string;         // Call-to-action button text
  onPress?: () => void;    // Optional callback function
}
```

## Available Icons

The component supports all SVG icons in `assets/Icons/`. Common options:

- `shield-person-6` - Identity verification
- `credit-card-8` - Card services
- `data-exploration-20` - Analytics/exploration
- `usdc-8` - Stablecoin funding
- `pie-chart-15` - Investment portfolio
- `wallet-3` - Wallet operations
- `send-money-7` - Money transfers
- `loyalty-14` - Rewards/loyalty

See `SvgIcon.tsx` for the complete list.

## Customization

### Gradient Presets

```typescript
// Purple gradient
gradient: ['#667EEA', '#764BA2']

// Pink/Red gradient
gradient: ['#F093FB', '#F5576C']

// Blue gradient
gradient: ['#4FACFE', '#00F2FE']

// Green gradient
gradient: ['#43E97B', '#38F9D7']

// Orange/Yellow gradient
gradient: ['#FA709A', '#FEE140']
```

### Slide Dimensions

Adjust in `ActionSlideshow.tsx`:

```typescript
const SLIDE_WIDTH = SCREEN_WIDTH - 64; // Padding control
const SLIDE_SPACING = 16; // Gap between slides
```

### Animation Timing

```typescript
// In ActionSlideshow component
decelerationRate="fast" // Or "normal"
scrollEventThrottle={16} // Lower = smoother but more CPU

// Scale animation
outputRange: [0.9, 1, 0.9] // Inactive/Active/Inactive

// Opacity animation
outputRange: [0.6, 1, 0.6] // Inactive/Active/Inactive
```

## Performance Considerations

- Uses `Animated.Value` with native driver where possible
- Throttled scroll events (16ms) for smooth performance
- Automatic cleanup of timers on unmount
- Optimized re-renders with proper memoization

## Accessibility

- Proper `accessibilityLabel` on interactive elements
- CTA buttons have clear labels
- Pagination dots are tappable for direct navigation
- Screen reader friendly

## Troubleshooting

### Icons not displaying

Ensure SVG files are in `assets/Icons/` and properly imported in `SvgIcon.tsx`.

### Gradient not working

Verify `expo-linear-gradient` is installed:

```bash
npx expo install expo-linear-gradient
```

### Auto-play not working

Check that `autoPlay={true}` and `slides.length > 1`.

### Scroll feels choppy

Try adjusting:
- `scrollEventThrottle` (lower = smoother)
- `decelerationRate` to "normal"
- Reduce slide count if too many

## Best Practices

1. **Limit Slides**: Keep 3-5 slides for optimal UX
2. **Consistent Timing**: Use 4-6 seconds per slide
3. **Clear CTAs**: Make action buttons descriptive
4. **Test on Device**: Emulators may not reflect actual performance
5. **Handle Errors**: Wrap navigation/API calls in try-catch
6. **Lazy Load**: Consider lazy loading heavy content

## Future Enhancements

- [ ] Gesture-based navigation (swipe)
- [ ] Video slide support
- [ ] Progress bar indicators
- [ ] Parallax effects
- [ ] Deep linking support
- [ ] Analytics tracking

## License

Part of the Testrun project.
