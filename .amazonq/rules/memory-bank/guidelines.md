# Development Guidelines

## Code Quality Standards

### TypeScript Usage
- **Strict typing enforced throughout codebase** - All files use TypeScript with explicit type definitions
- **Interface-first approach** - Define interfaces for all data structures, API contracts, and component props
- **Type exports** - Export types alongside implementations for reusability (e.g., `export type { User, AuthState }`)
- **Avoid `any` type** - Use specific types or `unknown` with type guards when type is uncertain
- **Generic types for reusability** - Use generics for flexible, type-safe utilities (e.g., `ApiResponse<T>`)

### Naming Conventions
- **PascalCase** for components, interfaces, types, classes (e.g., `AmountInput`, `AuthState`, `SessionManager`)
- **camelCase** for variables, functions, methods (e.g., `handleKeypadPress`, `isTokenExpired`, `updateLastActivity`)
- **SCREAMING_SNAKE_CASE** for constants (e.g., `DEFAULT_KEYPAD_LAYOUT`, `SESSION_TIMEOUT_MS`, `USER_ENDPOINTS`)
- **Descriptive boolean names** - Prefix with `is`, `has`, `should` (e.g., `isAuthenticated`, `hasPasscode`, `shouldRefresh`)
- **Event handler prefix** - Use `handle` for event handlers (e.g., `handleDelete`, `handleDigitPress`, `handleQuickAmount`)
- **Callback prop prefix** - Use `on` for callback props (e.g., `onValueChange`, `onBack`, `onClose`)

### File Organization
- **One primary export per file** - Each file exports one main component, service, or utility
- **Grouped imports** - Organize imports in order: external libraries → internal modules → types → utilities
- **Index files for exports** - Use `index.ts` to aggregate and re-export related modules
- **Co-located types** - Define component-specific types in the same file or adjacent `.types.ts` file

### Documentation Standards
- **JSDoc for public APIs** - Document all exported functions, classes, and complex logic with JSDoc comments
- **Inline comments for complex logic** - Explain "why" not "what" for non-obvious code
- **Component prop documentation** - Use JSDoc to document all component props with descriptions
- **README files for modules** - Include README.md in feature directories explaining architecture and usage

## Architectural Patterns

### State Management Pattern (Zustand)
```typescript
// Store structure: separate state interface from actions interface
interface State {
  // Data properties only
  user: User | null;
  isLoading: boolean;
}

interface Actions {
  // Methods only
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Use create with persist middleware for persistence
export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoading: false,
      
      // Actions
      login: async (email, password) => {
        set({ isLoading: true });
        // Implementation
      },
    }),
    {
      name: 'store-name',
      storage: createCustomStorage(), // Custom storage for sensitive data
      partialize: (state) => ({ /* select what to persist */ }),
    }
  )
);
```

**Key Patterns:**
- Separate state and actions into distinct interfaces for clarity
- Use `persist` middleware with custom storage for sensitive data (tokens, credentials)
- Implement `partialize` to control what gets persisted
- Use `set` for state updates, `get` to access current state within actions
- Async actions should handle loading states and errors consistently

### API Service Pattern
```typescript
// Define endpoints as constants
const ENDPOINTS = {
  PROFILE: '/v1/users/me',
  UPDATE: '/v1/users/me',
};

// Service object with methods
export const service = {
  async getProfile(): Promise<User> {
    return apiClient.get<User>(ENDPOINTS.PROFILE);
  },
  
  async updateProfile(data: Partial<User>): Promise<User> {
    return apiClient.put<User>(ENDPOINTS.UPDATE, data);
  },
};
```

**Key Patterns:**
- Group related API calls in service objects
- Define endpoints as constants at module level
- Use generic types for type-safe responses
- Return typed promises for all async operations
- Export service as default and named export

### Component Architecture Pattern
```typescript
// Props interface with JSDoc
export interface ComponentProps extends ViewProps {
  /** Description of prop */
  value?: string;
  /** Callback description */
  onValueChange?: (value: string) => void;
}

// Functional component with React.FC
export const Component: React.FC<ComponentProps> = ({
  value,
  onValueChange,
  className = '',
  ...rest
}) => {
  // Hooks at top
  const [state, setState] = useState('');
  
  // Memoized values
  const computed = useMemo(() => {
    return /* computation */;
  }, [dependencies]);
  
  // Callbacks
  const handleAction = useCallback(() => {
    // Implementation
  }, [dependencies]);
  
  // Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  // Render
  return (
    <View className={`base-classes ${className}`} {...rest}>
      {/* JSX */}
    </View>
  );
};

Component.displayName = 'Component';
```

**Key Patterns:**
- Extend base props (ViewProps, TouchableOpacityProps) for native component compatibility
- Destructure props with default values in function signature
- Spread remaining props with `...rest` pattern
- Order hooks: state → memoized values → callbacks → effects
- Set `displayName` for better debugging
- Use `React.FC` type for functional components

### Error Handling Pattern
```typescript
try {
  set({ isLoading: true, error: null });
  const response = await service.action(data);
  
  // Validate response
  if (!response.requiredField) {
    throw new Error('Invalid response from service');
  }
  
  set({ data: response, isLoading: false });
} catch (error: any) {
  safeError('[Context] Action failed:', error);
  
  const errorMessage = error?.error?.message 
    || error?.message 
    || 'Action failed. Please try again.';
  
  set({ error: errorMessage, isLoading: false });
  throw error;
}
```

**Key Patterns:**
- Set loading state at start, clear on completion
- Clear previous errors before new operations
- Validate API responses before using data
- Use `safeError` utility for logging (sanitizes sensitive data)
- Extract error messages with fallback chain
- Always set loading to false in catch block
- Re-throw errors for caller handling

### Security Pattern
```typescript
// Secure storage wrapper
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

**Key Patterns:**
- Split storage: sensitive data in SecureStore, non-sensitive in AsyncStorage
- Never log sensitive data (tokens, passwords, PII)
- Use `safeError` utility for sanitized logging
- Validate and sanitize all user inputs
- Implement rate limiting for authentication attempts
- Use lockout mechanism after failed attempts

## React Native Specific Patterns

### Haptic Feedback
```typescript
import * as Haptics from 'expo-haptics';

// Light feedback for standard interactions
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Medium feedback for important actions
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Heavy feedback for critical actions
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
```

**Usage Guidelines:**
- Add haptic feedback to all touchable interactions
- Use Light for keypad presses, button taps
- Use Medium for delete/backspace, confirmations
- Use Heavy for errors, critical actions

### Animation Pattern
```typescript
// Create animation refs
const scaleAnim = useRef(new Animated.Value(1)).current;
const opacityAnim = useRef(new Animated.Value(1)).current;

// Trigger animation on state change
useEffect(() => {
  Animated.sequence([
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1.08,
        useNativeDriver: true,
        speed: 50,
        bounciness: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.85,
        duration: 80,
        useNativeDriver: true,
      }),
    ]),
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 40,
        bounciness: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]),
  ]).start();
}, [dependency]);

// Apply to component
<Animated.Text
  style={{
    transform: [{ scale: scaleAnim }],
    opacity: opacityAnim,
  }}
>
  {content}
</Animated.Text>
```

**Key Patterns:**
- Use `useRef` to persist animation values across renders
- Always set `useNativeDriver: true` for performance
- Combine animations with `Animated.parallel` and `Animated.sequence`
- Use `spring` for natural, bouncy animations
- Use `timing` for linear, controlled animations

### Platform-Specific Rendering
```typescript
import { Platform } from 'react-native';

// Conditional rendering
if (Platform.OS !== 'ios') {
  return <FallbackComponent {...props} />;
}

// Platform-specific styles
const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: { shadowRadius: 42 },
      android: { elevation: 8 },
    }),
  },
});
```

**Key Patterns:**
- Check `Platform.OS` for platform-specific features
- Provide fallbacks for platform-exclusive components
- Use `Platform.select` for platform-specific styles
- Test on both iOS and Android

### Safe Area Handling
```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Component = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
      {/* Content */}
    </View>
  );
};
```

**Key Patterns:**
- Use `useSafeAreaInsets` hook for dynamic safe area values
- Apply `Math.max` to ensure minimum padding
- Consider safe areas for bottom navigation, modals, full-screen components

## Styling Patterns (NativeWind/Tailwind)

### Class Name Composition
```typescript
// Base classes with conditional additions
<View className={`flex-1 bg-white px-4 ${className}`} {...rest}>

// Conditional classes
<Text className={`text-base ${isActive ? 'text-blue-500' : 'text-gray-500'}`}>

// Status-based classes
const colorClass = status === 'error' 
  ? 'text-red-500' 
  : status === 'success' 
  ? 'text-green-500' 
  : 'text-gray-900';
```

**Key Patterns:**
- Always accept `className` prop for extensibility
- Append custom classes to base classes
- Use template literals for conditional classes
- Extract complex class logic to variables
- Prefer Tailwind utilities over inline styles

### Common Class Patterns
- **Flex layouts:** `flex-1`, `flex-row`, `items-center`, `justify-between`
- **Spacing:** `px-4`, `py-2`, `mt-6`, `gap-x-2`, `gap-y-4`
- **Typography:** `text-base`, `font-body-semibold`, `text-gray-900`, `leading-none`
- **Borders:** `border-2`, `border-gray-800`, `rounded-full`
- **Backgrounds:** `bg-white`, `bg-gray-100`, `bg-transparent`
- **Opacity:** `opacity-70`, `opacity-85`

## Testing Patterns

### Test Structure
```typescript
import { renderHook, waitFor } from '@testing-library/react-native';

describe('Feature', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should handle expected behavior', async () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = await action(input);
    
    // Assert
    expect(result).toBe(expected);
  });
});
```

**Key Patterns:**
- Use `describe` blocks to group related tests
- Use `beforeEach`/`afterEach` for setup/cleanup
- Follow Arrange-Act-Assert pattern
- Use descriptive test names starting with "should"
- Test async operations with `async/await` and `waitFor`

## Performance Optimization Patterns

### Memoization
```typescript
// Memoize expensive computations
const computed = useMemo(() => {
  return expensiveOperation(data);
}, [data]);

// Memoize callbacks to prevent re-renders
const handleAction = useCallback(() => {
  doSomething(value);
}, [value]);
```

**Usage Guidelines:**
- Use `useMemo` for expensive calculations
- Use `useCallback` for callbacks passed to child components
- Only memoize when there's measurable performance benefit
- Keep dependency arrays accurate and minimal

### Conditional Rendering
```typescript
// Early returns for conditional rendering
if (!data) {
  return <LoadingState />;
}

// Conditional components
{isVisible && <Component />}
{error ? <ErrorView /> : <SuccessView />}
```

**Key Patterns:**
- Use early returns for loading/error states
- Use `&&` for simple conditional rendering
- Use ternary for either/or rendering
- Avoid nested ternaries

## Common Code Idioms

### Input Validation Pattern
```typescript
// Validate inputs at function start
if (!email || !password) {
  const error = new Error('Email and password are required');
  set({ error: error.message, isLoading: false });
  throw error;
}

if (password.length < 8) {
  const error = new Error('Password must be at least 8 characters');
  set({ error: error.message, isLoading: false });
  throw error;
}
```

### Controlled vs Uncontrolled Components
```typescript
// Support both controlled and uncontrolled modes
const isControlled = value !== undefined;
const [internalValue, setInternalValue] = useState(defaultValue);

const currentValue = useMemo(() => {
  if (isControlled) {
    return value ?? defaultValue;
  }
  return internalValue;
}, [isControlled, internalValue, value]);

const setValue = useCallback((next: string) => {
  if (!isControlled) {
    setInternalValue(next);
  }
  onValueChange?.(next);
}, [isControlled, onValueChange]);
```

### Session Management Pattern
```typescript
// Timer-based session management
private static timer: ReturnType<typeof setTimeout> | null = null;

static scheduleAction(expiresAt: string): void {
  if (this.timer) {
    clearTimeout(this.timer);
    this.timer = null;
  }
  
  const timeUntilExpiry = this.getTimeUntilExpiry(expiresAt);
  
  if (timeUntilExpiry > 0) {
    this.timer = setTimeout(() => {
      this.handleExpiry();
    }, timeUntilExpiry);
  }
}

static cleanup(): void {
  if (this.timer) {
    clearTimeout(this.timer);
    this.timer = null;
  }
}
```

### Response Validation Pattern
```typescript
const response = await service.action(data);

if (!response.requiredField || !response.anotherRequired) {
  throw new Error('Invalid response from service');
}

// Safe to use response data
set({ data: response });
```

## Frequently Used Annotations

### Component Annotations
```typescript
Component.displayName = 'ComponentName';
```

### Type Annotations
```typescript
// Extend base types
interface Props extends ViewProps { }

// Union types for status
type Status = 'idle' | 'loading' | 'success' | 'error';

// Readonly arrays
const LAYOUT = [['1', '2', '3']] as const;
type Key = (typeof LAYOUT)[number][number];

// Optional chaining
const value = response?.data?.field ?? defaultValue;
```

### JSDoc Annotations
```typescript
/**
 * Brief description
 * 
 * @param param - Parameter description
 * @returns Return value description
 * @throws Error description
 */
```

## Code Review Checklist

Before submitting code, ensure:
- [ ] All TypeScript types are explicit and accurate
- [ ] No `any` types without justification
- [ ] Error handling implemented with proper logging
- [ ] Sensitive data not logged or exposed
- [ ] Loading states managed consistently
- [ ] Haptic feedback added to interactions
- [ ] Platform-specific code has fallbacks
- [ ] Components accept `className` prop
- [ ] Callbacks memoized with `useCallback`
- [ ] Expensive computations memoized with `useMemo`
- [ ] Tests written for new functionality
- [ ] JSDoc comments for public APIs
- [ ] No console.log statements (use proper logging)
- [ ] Accessibility considered (labels, hints)
