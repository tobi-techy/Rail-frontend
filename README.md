# Rail Mobile App

A React Native mobile application built with Expo for modern finance management.

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Navigation**: Expo Router
- **State Management**: Zustand
- **API Layer**: Axios + TanStack React Query
- **Styling**: NativeWind (TailwindCSS)
- **Testing**: Jest + React Native Testing Library

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- iOS Simulator (macOS) or Android Emulator
- Expo CLI

### Installation

```bash
# Install dependencies
bun install

# Start development server
bun start

# Run on iOS
bun ios

# Run on Android
bun android
```

### Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Required environment variables:

- `EXPO_PUBLIC_API_URL` - Backend API URL
- `EXPO_PUBLIC_SENTRY_DSN` - Sentry error tracking DSN

## Scripts

| Command             | Description              |
| ------------------- | ------------------------ |
| `bun start`         | Start Expo dev server    |
| `bun ios`           | Run on iOS simulator     |
| `bun android`       | Run on Android emulator  |
| `bun test`          | Run tests                |
| `bun test:coverage` | Run tests with coverage  |
| `bun lint`          | Run ESLint and Prettier  |
| `bun format`        | Fix linting issues       |
| `bun typecheck`     | TypeScript type checking |
| `bun validate`      | Run all checks           |

## EAS Build Profiles

- `development`: local dev client
- `preview`: internal distribution
- `testflight`: App Store/TestFlight build wired to staging backend (`https://rail-backend-service-production.up.railway.app/api`)
- `production`: production release profile

Example TestFlight build:

```bash
eas build --platform ios --profile testflight
```

For Xcode archive/TestFlight uploads, `ios/.xcode.env` now defaults Release builds to staging:

- `EXPO_PUBLIC_ENV=staging`
- `EXPO_PUBLIC_API_URL=https://rail-backend-service-production.up.railway.app/api`

## Project Structure

```
├── app/                 # Expo Router screens
│   ├── (auth)/         # Authentication screens
│   ├── (tabs)/         # Main tab screens
│   └── _layout.tsx     # Root layout
├── api/                # API layer
│   ├── hooks/          # React Query hooks
│   ├── services/       # API service functions
│   └── types/          # API type definitions
├── components/         # UI components
│   ├── atoms/          # Basic components
│   ├── molecules/      # Composite components
│   └── organisms/      # Complex components
├── stores/             # Zustand stores
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
└── assets/             # Static assets
```

## Testing

```bash
# Run all tests
bun test

# Run with coverage
bun test:coverage

# Run in watch mode
bun test:watch
```

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

## License

Private - All rights reserved.
