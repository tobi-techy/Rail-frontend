# Technology Stack

## Core Technologies

### Language & Framework
- **TypeScript**: 5.9.3 - Type-safe development with strict mode
- **React**: 19.1.0 - UI library
- **React Native**: 0.81.5 - Cross-platform mobile framework
- **Expo**: SDK 54.0.17 - Development and deployment platform
- **Expo Router**: 6.0.13 - File-based routing system

### State Management
- **Zustand**: 4.5.1 - Lightweight state management
- **@tanstack/react-query**: 5.90.5 - Server state management and caching

### Styling & UI
- **NativeWind**: 4.1.21 - Tailwind CSS for React Native
- **Tailwind CSS**: 3.4.0 - Utility-first CSS framework
- **@rneui/themed**: 4.0.0-rc.8 - React Native Elements UI library
- **Expo Linear Gradient**: 15.0.7 - Gradient components
- **Expo Blur**: 15.0.7 - Blur effects

### Animation & Gestures
- **React Native Reanimated**: 4.1.2 - Performant animations
- **React Native Gesture Handler**: 2.28.0 - Touch gesture handling
- **Moti**: 0.30.0 - Animation library built on Reanimated
- **@shopify/react-native-skia**: 2.2.12 - 2D graphics rendering

### Navigation & Routing
- **Expo Router**: 6.0.13 - File-based routing
- **@react-navigation/native**: 7.1.6 - Navigation library
- **React Native Screens**: 4.16.0 - Native screen optimization
- **React Native Safe Area Context**: 5.6.1 - Safe area handling

### API & Networking
- **Axios**: 1.12.2 - HTTP client
- **React Query**: 5.90.5 - Data fetching and caching
- **React Native URL Polyfill**: 2.0.0 - URL API polyfill

### Security & Storage
- **Expo Secure Store**: 15.0.7 - Secure key-value storage
- **Expo Local Authentication**: 17.0.7 - Biometric authentication
- **Crypto-JS**: 4.2.0 - Encryption/decryption utilities
- **@react-native-async-storage/async-storage**: 2.2.0 - Async storage

### Charts & Visualization
- **React Native Gifted Charts**: 1.4.64 - Chart components
- **D3 Scale**: 4.0.2 - Scale functions for charts
- **D3 Shape**: 3.2.0 - Shape generators

### UI Components & Utilities
- **Lucide React Native**: 0.544.0 - Icon library
- **React Native SVG**: 15.12.1 - SVG rendering
- **React Native QRCode Skia**: 0.3.1 - QR code generation
- **React Native OTP Entry**: 1.8.5 - OTP input component
- **Expo Clipboard**: 8.0.7 - Clipboard access
- **Expo Haptics**: 15.0.7 - Haptic feedback

### Development Tools
- **TypeScript**: 5.9.3 - Type checking
- **ESLint**: 9.25.1 - Code linting
- **Prettier**: 3.2.5 - Code formatting
- **Jest**: 29.7.0 - Testing framework
- **@testing-library/react-native**: 12.4.3 - Testing utilities

### Build & Deployment
- **Expo Dev Client**: 6.0.16 - Custom development builds
- **Metro**: Bundler (via Expo)
- **EAS**: Expo Application Services for builds and updates

## Development Commands

### Core Commands
```bash
npm start              # Start Expo development server
npm run android        # Run on Android emulator
npm run ios            # Run on iOS simulator
npm run web            # Run on web browser
npm run prebuild       # Generate native projects
```

### Code Quality
```bash
npm run lint           # Run ESLint and Prettier checks
npm run format         # Auto-fix linting and format code
```

### Testing
```bash
npm test               # Run tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate coverage report
npm run test:ci        # Run tests in CI environment
```

### Docker Commands
```bash
npm run docker:build   # Build Docker image
npm run docker:dev     # Run development container
npm run docker:prod    # Run production container
npm run docker:backend # Run backend services
npm run docker:database # Run PostgreSQL database
npm run docker:stop    # Stop all containers
npm run docker:clean   # Clean up containers and volumes
```

## Configuration Files

### TypeScript Configuration
- **tsconfig.json** - Main TypeScript configuration with strict mode
- **tsconfig.test.json** - Test-specific TypeScript configuration
- **nativewind-env.d.ts** - NativeWind type declarations

### Build Configuration
- **app.json** - Expo app configuration
- **eas.json** - EAS Build configuration
- **babel.config.js** - Babel transpiler configuration
- **metro.config.js** - Metro bundler configuration

### Styling Configuration
- **tailwind.config.js** - Tailwind CSS configuration
- **global.css** - Global CSS styles
- **prettier.config.js** - Prettier formatting rules

### Testing Configuration
- **jest.setup.js** - Jest test setup
- **package.json** (jest section) - Jest configuration

### Linting Configuration
- **eslint.config.js** - ESLint rules and configuration

### Docker Configuration
- **Dockerfile** - Docker image definition
- **docker-compose.yml** - Multi-container setup
- **.dockerignore** - Docker ignore patterns

## Environment Variables

### Required Variables (from .env.example)
```env
EXPO_PUBLIC_API_URL=<backend-api-url>
EXPO_PUBLIC_GRAPHQL_ENDPOINT=<graphql-endpoint>
EXPO_PUBLIC_AUTH0_DOMAIN=<auth0-domain>
EXPO_PUBLIC_AUTH0_CLIENT_ID=<auth0-client-id>
```

### Environment Files
- **.env** - Local environment variables (gitignored)
- **.env.example** - Template for environment variables
- **.env.development.shared** - Shared development environment variables

## Platform Support

### iOS
- **Bundle Identifier**: com.josephweb3.rail
- **Build Number**: 1.0.0
- **Supports Tablet**: Yes
- **Adaptive Icons**: Dark, Light, Tinted variants
- **Native Project**: ios/rail.xcodeproj

### Android
- **Package Name**: com.josephweb3.rail
- **Adaptive Icon**: Foreground image with white background
- **Native Project**: android/app

### Web
- **Bundler**: Metro
- **Output**: Static
- **Favicon**: ./assets/favicon.png

## External Integrations

### Backend Services
- **Circle API** - Developer-controlled wallets and USDC management
- **DriveWealth API** - Brokerage and investment execution
- **0G Network** - AI inference and storage

### Authentication
- **Auth0 / AWS Cognito** - User authentication and authorization

### Blockchain Networks
- **Ethereum** - EVM-compatible chain
- **Polygon** - EVM-compatible chain
- **Base** - EVM-compatible chain
- **Solana** - Non-EVM chain

## Package Manager
- **pnpm** - Fast, disk space efficient package manager
- **.npmrc** - npm/pnpm configuration

## Version Control
- **.gitignore** - Git ignore patterns for node_modules, .env, build artifacts, etc.

## Testing Stack
- **Jest**: Test runner and framework
- **Jest Expo**: Expo-specific Jest preset
- **React Native Testing Library**: Component testing utilities
- **@testing-library/jest-native**: Additional matchers for React Native
- **React Test Renderer**: Snapshot testing

## Code Quality Tools
- **ESLint**: JavaScript/TypeScript linting
- **eslint-config-expo**: Expo-specific ESLint rules
- **eslint-config-prettier**: Prettier integration with ESLint
- **Prettier**: Code formatting
- **prettier-plugin-tailwindcss**: Tailwind class sorting

## Build Artifacts & Generated Files
- **/node_modules** - Dependencies
- **/.expo** - Expo build cache and generated files
- **/ios/Pods** - iOS CocoaPods dependencies
- **/android/build** - Android build output
- **/coverage** - Test coverage reports
