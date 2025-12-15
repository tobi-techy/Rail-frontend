# Technology Stack

## Programming Languages
- **TypeScript 5.9.2** - Primary language for type-safe development
- **JavaScript** - Configuration files and legacy compatibility
- **Swift** - iOS native modules (AppDelegate.swift)

## Core Frameworks

### Mobile Framework
- **React Native 0.81.5** - Cross-platform mobile development
- **React 19.1.0** - UI library
- **React DOM 19.1.0** - Web compatibility layer
- **Expo SDK ~54.0.27** - Development platform and native module access

### Navigation & Routing
- **expo-router ~6.0.17** - File-based routing system
- **@react-navigation/native ^7.1.6** - Navigation infrastructure
- **react-native-screens ~4.16.0** - Native screen optimization
- **react-native-safe-area-context ~5.6.0** - Safe area handling

## State Management

### Global State
- **Zustand ^4.5.1** - Lightweight state management
- **@tanstack/react-query ^5.90.5** - Server state management and caching

### Local Storage
- **@react-native-async-storage/async-storage ^2.2.0** - Async key-value storage
- **expo-secure-store ~15.0.8** - Encrypted credential storage

## API & Networking
- **Axios ^1.12.2** - HTTP client with interceptor support
- **react-native-url-polyfill ^2.0.0** - URL API polyfill
- **ws ^8.16.0** - WebSocket client

## UI & Styling

### Styling System
- **NativeWind (latest)** - Tailwind CSS for React Native
- **TailwindCSS ^3.4.0** - Utility-first CSS framework
- **react-native-css-interop ^0.2.1** - CSS interoperability

### UI Libraries
- **@rneui/themed 4.0.0-rc.8** - React Native Elements UI kit
- **@rneui/base 4.0.0-rc.7** - Base UI components
- **@expo/ui ~0.2.0-beta.9** - Expo UI components
- **lucide-react-native ^0.544.0** - Icon library

### Animation & Graphics
- **react-native-reanimated ~4.1.1** - High-performance animations
- **react-native-gesture-handler ~2.28.0** - Touch gesture system
- **@shopify/react-native-skia 2.2.12** - 2D graphics rendering
- **moti ^0.30.0** - Declarative animations
- **expo-linear-gradient ~15.0.8** - Gradient components
- **expo-blur ~15.0.8** - Blur effects

### Charts & Visualization
- **react-native-gifted-charts ^1.4.64** - Chart components
- **d3-scale ^4.0.2** - Scale functions for data visualization
- **d3-shape ^3.2.0** - Shape generators

### SVG & Graphics
- **react-native-svg 15.12.1** - SVG rendering
- **react-native-svg-transformer ^1.5.0** - SVG import transformer
- **react-native-qrcode-skia ^0.3.1** - QR code generation

## Form & Input Components
- **react-native-otp-entry ^1.8.5** - OTP input component
- **@react-native-community/datetimepicker 8.4.4** - Date/time picker
- **react-native-keyboard-controller 1.18.5** - Keyboard management

## Native Features

### Authentication & Security
- **expo-local-authentication ~17.0.8** - Biometric authentication (Face ID, Touch ID)
- **crypto-js ^4.2.0** - Cryptographic functions
- **buffer ^6.0.3** - Buffer polyfill for crypto operations

### Device Features
- **expo-haptics ~15.0.8** - Haptic feedback
- **expo-clipboard ~8.0.8** - Clipboard access
- **expo-device ~8.0.10** - Device information
- **expo-constants ~18.0.11** - App constants and configuration

### Media & Content
- **expo-av ~16.0.8** - Audio/video playback
- **expo-video ~3.0.15** - Video player
- **expo-font ~14.0.10** - Custom font loading

### System Integration
- **expo-notifications ~0.32.14** - Push notifications
- **expo-linking ~8.0.10** - Deep linking
- **expo-web-browser ~15.0.10** - In-app browser
- **expo-splash-screen ~31.0.12** - Splash screen management
- **expo-status-bar ~3.0.9** - Status bar styling
- **expo-system-ui ~6.0.9** - System UI configuration
- **expo-symbols ~1.0.8** - SF Symbols (iOS)

## Error Tracking & Monitoring
- **@sentry/react-native ~7.2.0** - Error tracking and performance monitoring
- **sentry-expo** - Expo-specific Sentry integration

## Development Tools

### Build & Development
- **Bun** - Fast JavaScript runtime and package manager (primary)
- **Yarn** - Alternative package manager (fallback)
- **expo-dev-client ~6.0.20** - Custom development client
- **Metro** - JavaScript bundler for React Native

### Code Quality
- **ESLint ^9.25.1** - JavaScript/TypeScript linting
- **eslint-config-expo ~10.0.0** - Expo ESLint configuration
- **eslint-config-prettier ^10.1.2** - Prettier integration
- **Prettier ^3.2.5** - Code formatting
- **prettier-plugin-tailwindcss ^0.5.11** - Tailwind class sorting

### Testing
- **Jest ^29.7.0** - Testing framework
- **jest-expo ~54.0.14** - Expo-specific Jest preset
- **@testing-library/react-native ^12.4.3** - React Native testing utilities
- **react-test-renderer 19.1.0** - React component testing
- **@types/jest ^29.5.12** - Jest TypeScript types

### Type Definitions
- **@types/react ~19.1.10** - React type definitions
- **TypeScript ~5.9.2** - TypeScript compiler

## Build Configuration

### Babel
- **@babel/core ^7.20.0** - JavaScript compiler
- **babel.config.js** - Babel configuration

### Metro
- **metro.config.js** - Metro bundler configuration
- SVG transformer integration

### Native Build Tools
- **Gradle** - Android build system
- **CocoaPods** - iOS dependency manager
- **Xcode** - iOS development environment

## Platform-Specific Dependencies

### iOS
- **Swift** - Native iOS code
- **Podfile** - CocoaPods dependency specification
- **Sentry** - Error tracking SDK

### Android
- **Gradle** - Build automation
- **ProGuard** - Code obfuscation
- **Sentry** - Error tracking SDK

## Development Commands

### Primary Commands
```bash
bun start              # Start Expo development server
bun run ios            # Run on iOS simulator
bun run android        # Run on Android emulator
bun run web            # Run web version
```

### Development Workflow
```bash
bun run setup:dev      # Install dependencies
bun run prebuild       # Generate native projects
bun run lint           # Run linter
bun run format         # Format code
bun run typecheck      # Type checking
bun run validate       # Run all checks (typecheck + lint + test)
```

### Testing
```bash
bun test               # Run tests
bun run test:watch     # Watch mode
bun run test:coverage  # Generate coverage report
bun run test:ci        # CI mode with coverage
```

### Docker Commands
```bash
bun run docker:build   # Build Docker image
bun run docker:dev     # Run development container
bun run docker:prod    # Run production container
bun run docker:stop    # Stop containers
bun run docker:clean   # Clean containers and volumes
```

### Maintenance
```bash
bun run clean          # Clean cache and dependencies
bun run clean:cache    # Clean Expo cache
bun run clean:deps     # Reinstall dependencies
```

## Environment Configuration

### Environment Files
- **.env** - Development environment variables
- **.env.production** - Production environment variables
- **.env.example** - Environment template

### Configuration Files
- **app.json** - Expo app configuration
- **eas.json** - Expo Application Services configuration
- **tsconfig.json** - TypeScript configuration
- **tailwind.config.js** - Tailwind CSS configuration
- **jest.setup.js** - Jest test setup
- **cesconfig.jsonc** - Code editor services configuration

## Third-Party Integrations

### Financial Services
- **Circle** - Developer-Controlled Wallets, USDC on/off-ramps
- **DriveWealth** - Brokerage services, trade execution

### Infrastructure
- **0G** - Storage and AI capabilities
- **Sentry** - Error tracking and performance monitoring

## Package Manager Configuration
- **bunfig.toml** - Bun configuration
- **bun.lock** - Bun lockfile
- **yarn.lock** - Yarn lockfile (fallback)
- **.npmrc** - npm configuration

## Version Control
- **.gitignore** - Git ignore patterns
- **.gitattributes** - Git attributes configuration
- **.dockerignore** - Docker ignore patterns
- **.bunignore** - Bun ignore patterns

## Deployment

### Expo Application Services (EAS)
- **Project ID:** d2824fee-1afc-48e0-a253-e72399dd968b
- **Platforms:** iOS, Android
- **Build Profiles:** Development, Preview, Production

### Docker Support
- **Dockerfile** - Container definition
- **docker-compose.yml** - Multi-container orchestration
- Profiles: app-dev, production, backend, database
