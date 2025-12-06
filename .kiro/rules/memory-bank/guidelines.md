# Development Guidelines

## Code Quality Standards

### TypeScript Usage
- **Strict Type Safety**: All code uses TypeScript with strict mode enabled
- **Interface Over Type**: Prefer `interface` for object shapes, especially for component props and API contracts
- **Explicit Return Types**: Functions declare return types explicitly (e.g., `Promise<void>`, `Promise<User>`)
- **Type Imports**: Use `type` keyword for type-only imports: `import type { User } from '../types'`
- **Null Safety**: Explicit null checks and optional chaining (`?.`) used throughout
- **Generic Types**: Leverage generics for reusable API client methods (e.g., `apiClient.get<User>()`)

### Code Formatting
- **Functional Components**: All React components use function syntax with arrow functions or function declarations
- **Named Exports**: Components and services use named exports (e.g., `export const SvgIcon`, `export const userService`)
- **Destructuring**: Props and state destructured at function start
- **Single Responsibility**: Each file has one primary export with clear purpose
- **Consistent Spacing**: 2-space indentation, consistent line breaks between logical sections

### Naming Conventions
- **PascalCase**: Components, interfaces, types (e.g., `SvgIcon`, `AuthState`, `User`)
- **camelCase**: Variables, functions, methods (e.g., `getProfile`, `isAuthenticated`, `accessToken`)
- **SCREAMING_SNAKE_CASE**: Constants and configuration objects (e.g., `USER_ENDPOINTS`, `TAB_CONFIG`)
- **Descriptive Names**: Use auxiliary verbs for booleans (e.g., `isLoading`, `hasPasscode`, `isBiometricEnabled`)
- **Prefix Conventions**: 
  - `use` for hooks (e.g., `useAuthStore`, `useColorScheme`)
  - `handle` for event handlers (e.g., `handleSessionExpired`, `handlePasscodeSessionExpired`)
  - `set` for state setters (e.g., `setUser`, `setTokens`, `setPasscodeSession`)

### Documentation
- **JSDoc Comments**: All public functions and complex logic documented with JSDoc
- **Inline Comments**: Explain "why" not "what" - used for business logic clarification
- **Section Comments**: Major sections separated with descriptive comments
- **Type Documentation**: Complex types include inline comments for clarity

## State Management Patterns

### Zustand Store Structure
```typescript
// 1. Define state interface
interface AuthState {
  // Group related fields with comments
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  // ...
}

// 2. Define actions interface
interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // ...
}

// 3. Create initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  // ...
};

// 4. Create store with persist middleware
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Implement actions
      login: async (email, password) => {
        // Validation
        if (!email || !password) {
          throw new Error('Email and password are required');
        }
        
        // Set loading state
        set({ isLoading: true, error: null });
        
        try {
          // API call
          const response = await authService.login({ email, password });
          
          // Update state
          set({
            user: response.user,
            isAuthenticated: true,
            // ...
          });
        } catch (error) {
          // Error handling
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createSecureStorage(),
    }
  )
);
```

### Store Best Practices
- **Separation of Concerns**: Separate state interface from actions interface
- **Initial State**: Define complete initial state object for reset functionality
- **Async Actions**: All async operations use try-catch with proper error handling
- **State Updates**: Use `set()` for updates, `get()` for reading current state
- **Validation**: Input validation at the start of action functions
- **Error Handling**: Consistent error handling with user-friendly messages
- **Persistence**: Use middleware for persistence with secure storage for sensitive data

## API Service Patterns

### Service Structure
```typescript
// 1. Define endpoints as constants
const USER_ENDPOINTS = {
  PROFILE: '/v1/users/me',
  UPDATE_PROFILE: '/v1/users/me',
  SETTINGS: '/user/settings',
  // ...
};

// 2. Export service object with methods
export const userService = {
  /**
   * Get user profile
   */
  async getProfile(): Promise<User> {
    return apiClient.get<User>(USER_ENDPOINTS.PROFILE);
  },

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    return apiClient.put<User>(USER_ENDPOINTS.UPDATE_PROFILE, data);
  },
  
  // ...
};

export default userService;
```

### API Service Best Practices
- **Endpoint Constants**: All endpoints defined in uppercase constant object
- **JSDoc Documentation**: Each method documented with purpose
- **Type Safety**: Generic types for request/response (e.g., `apiClient.get<User>()`)
- **Consistent Naming**: Method names match HTTP verbs (get, post, put, delete)
- **Default Export**: Service exported as both named and default export
- **Error Propagation**: Let errors bubble up to be handled by interceptors/hooks

## Component Patterns

### Functional Component Structure
```typescript
// 1. Imports
import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { SomeType } from '../types';

// 2. Type definitions
export interface ComponentProps {
  name: string;
  width?: number;
  height?: number;
  onPress?: () => void;
}

// 3. Constants (if needed)
const DEFAULT_SIZE = 24;

// 4. Component definition
export const Component: React.FC<ComponentProps> = ({
  name,
  width = DEFAULT_SIZE,
  height = DEFAULT_SIZE,
  onPress,
  ...props
}) => {
  // Hooks
  const [state, setState] = React.useState(false);
  
  // Event handlers
  const handlePress = () => {
    onPress?.();
  };
  
  // Render
  return (
    <View style={styles.container}>
      {/* JSX */}
    </View>
  );
};

// 5. Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

### Component Best Practices
- **Props Interface**: Export props interface for reusability
- **Default Props**: Use default parameters in destructuring
- **Spread Props**: Support `...props` for flexibility
- **Hooks First**: All hooks called at top of component
- **Event Handlers**: Define handlers before render
- **StyleSheet**: Use `StyleSheet.create()` for performance
- **Conditional Rendering**: Use ternary or logical AND operators
- **Early Returns**: Return null early for invalid states

## Security Patterns

### Secure Storage Pattern
```typescript
// Split sensitive and non-sensitive data
const createSecureStorage = () => ({
  getItem: async (name: string) => {
    const data = await AsyncStorage.getItem(name);
    if (data) {
      const parsed = JSON.parse(data);
      // Load sensitive data from SecureStore
      if (parsed.accessToken) {
        parsed.accessToken = await secureStorage.getItem(`${name}_accessToken`);
      }
      return parsed;
    }
    return null;
  },
  
  setItem: async (name: string, value: any) => {
    // Store sensitive data in SecureStore
    if (value.accessToken) {
      await secureStorage.setItem(`${name}_accessToken`, value.accessToken);
      delete value.accessToken;
    }
    // Store non-sensitive data in AsyncStorage
    await AsyncStorage.setItem(name, JSON.stringify(value));
  },
});
```

### Security Best Practices
- **Token Storage**: Store tokens in Expo SecureStore, not AsyncStorage
- **Sensitive Data Separation**: Split sensitive/non-sensitive data storage
- **Input Validation**: Validate all user inputs before processing
- **Error Sanitization**: Use `safeError()` to sanitize logs
- **Session Management**: Implement token expiry and refresh logic
- **Lockout Mechanism**: Implement failed attempt tracking and account lockout

## Session Management Patterns

### Session Lifecycle
```typescript
export class SessionManager {
  private static refreshTimer: NodeJS.Timeout | null = null;
  private static initialized = false;
  
  /**
   * Initialize session management
   */
  static initialize(): void {
    if (this.initialized) return;
    
    const { isAuthenticated, checkTokenExpiry } = useAuthStore.getState();
    
    if (!isAuthenticated) return;
    
    // Check if token expired
    if (checkTokenExpiry()) {
      this.handleSessionExpired();
      return;
    }
    
    // Schedule health checks
    this.scheduleHealthCheck();
    this.initialized = true;
  }
  
  /**
   * Handle session expiration
   */
  static handleSessionExpired(): void {
    this.cleanup();
    const { clearExpiredSession } = useAuthStore.getState();
    clearExpiredSession();
  }
  
  /**
   * Cleanup timers
   */
  static cleanup(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.initialized = false;
  }
}
```

### Session Management Best Practices
- **Static Class Pattern**: Use static methods for singleton behavior
- **Timer Management**: Track and cleanup timers properly
- **Initialization Guard**: Prevent double initialization
- **Graceful Degradation**: Handle missing tokens gracefully
- **Automatic Refresh**: Schedule token refresh before expiry
- **Health Checks**: Periodic validation of session state

## Error Handling Patterns

### Consistent Error Handling
```typescript
try {
  // Validate inputs first
  if (!email || !password) {
    const error = new Error('Email and password are required');
    set({ error: error.message, isLoading: false });
    throw error;
  }
  
  // Set loading state
  set({ isLoading: true, error: null });
  
  // Perform operation
  const response = await authService.login({ email, password });
  
  // Update state on success
  set({
    user: response.user,
    isLoading: false,
  });
} catch (error: any) {
  // Log error safely
  safeError('[AuthStore] Login failed:', error);
  
  // Extract user-friendly message
  const errorMessage = error?.error?.message || error?.message || 'Login failed';
  
  // Update error state
  set({
    error: errorMessage,
    isLoading: false,
  });
  
  // Re-throw for caller
  throw error;
}
```

### Error Handling Best Practices
- **Early Validation**: Validate inputs before async operations
- **Loading States**: Set loading true before, false after operations
- **Safe Logging**: Use `safeError()` to prevent sensitive data leaks
- **User-Friendly Messages**: Extract or provide fallback error messages
- **Error Propagation**: Re-throw errors for upstream handling
- **State Cleanup**: Always reset loading/error states

## Platform-Specific Patterns

### iOS-Specific Features
```typescript
// Check platform before using iOS-only features
if (Platform.OS !== 'ios') {
  return <BottomTabBar {...props} />;
}

// Use iOS-specific components
return (
  <Host style={styles.host} colorScheme={scheme ?? 'light'}>
    <Namespace id={namespaceId}>
      {/* iOS-specific UI */}
    </Namespace>
  </Host>
);
```

### Platform Best Practices
- **Platform Checks**: Use `Platform.OS` for conditional rendering
- **Fallback Components**: Provide cross-platform alternatives
- **Safe Area Handling**: Use `useSafeAreaInsets()` for proper spacing
- **Color Scheme**: Use `useColorScheme()` for dark mode support

## Common Code Idioms

### Conditional Rendering
```typescript
// Ternary for two states
{isFocused ? <ActiveComponent /> : <InactiveComponent />}

// Logical AND for single state
{isFocused && <ActiveComponent />}

// Nullish coalescing for defaults
const value = response.value ?? defaultValue;

// Optional chaining for safe access
const name = user?.profile?.name;
```

### Array Operations
```typescript
// Map with index
{state.routes.map((route, index) => (
  <Component key={route.key} index={index} />
))}

// Filter and map
const activeItems = items.filter(item => item.active).map(item => item.name);
```

### Object Destructuring
```typescript
// Props destructuring with defaults
const Component = ({ name, size = 24, ...props }) => { };

// State destructuring
const { user, isAuthenticated, accessToken } = useAuthStore.getState();

// Nested destructuring
const { state, descriptors, navigation } = props;
```

### Async/Await Patterns
```typescript
// Always use try-catch with async
async function fetchData() {
  try {
    const data = await apiCall();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Promise chaining for cleanup
await authService.logout().catch(() => {
  // Ignore errors - still clear local state
});
```

## Testing Patterns

### Test Structure
- Tests organized in `__tests__` directory mirroring source structure
- Use Jest with React Native Testing Library
- Mock external dependencies in `__mocks__` directory
- Test files named with `.test.ts` or `.test.tsx` suffix

## Import Patterns

### Import Organization
```typescript
// 1. External libraries
import React from 'react';
import { View, StyleSheet } from 'react-native';

// 2. Third-party libraries
import { create } from 'zustand';

// 3. Internal modules (absolute imports with @/)
import { authService } from '@/api/services';
import type { User } from '@/api/types';

// 4. Relative imports
import { secureStorage } from '../utils/secureStorage';
```

### Import Best Practices
- **Absolute Imports**: Use `@/` alias for cleaner imports
- **Type Imports**: Separate type imports with `type` keyword
- **Grouped Imports**: Group by external, third-party, internal, relative
- **Named Imports**: Prefer named imports over default imports

## Configuration Patterns

### Constants and Configuration
```typescript
// Define configuration objects with explicit types
const TAB_CONFIG: Record<string, TabDefinition> = {
  index: {
    icon: 'house.fill',
    title: 'Home',
    indicatorTint: 'rgba(16, 206, 134, 0.78)',
  },
  // ...
};

// Use uppercase for endpoint constants
const USER_ENDPOINTS = {
  PROFILE: '/v1/users/me',
  SETTINGS: '/user/settings',
};
```

### Configuration Best Practices
- **Type Annotations**: Explicitly type configuration objects
- **Centralized Constants**: Keep related constants together
- **Descriptive Keys**: Use clear, descriptive key names
- **Immutable Values**: Treat configuration as read-only
