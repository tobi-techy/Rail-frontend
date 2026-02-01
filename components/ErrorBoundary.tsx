import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from './atoms/Icon';
import { safeError } from '../utils/logSanitizer';
import { Sentry } from '../lib/sentry';
import { Button } from '@/components/ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    safeError('[ErrorBoundary] Caught error:', { message: error.message, name: error.name });
    safeError('[ErrorBoundary] Error info:', errorInfo);

    // Send to Sentry in production (with retry logic)
    if (!__DEV__) {
      try {
        Sentry.captureException(error, {
          contexts: {
            react: { componentStack: errorInfo.componentStack },
            app: {
              retryCount: this.retryCount,
              userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
              timestamp: new Date().toISOString(),
            },
          },
          tags: {
            component: 'ErrorBoundary',
            severity: 'error',
          },
        });
      } catch (sentryError) {
        console.error('[ErrorBoundary] Failed to send to Sentry:', sentryError);
      }
    }
  }

  resetError = (): void => {
    this.retryCount++;

    // Prevent infinite retry loops
    if (this.retryCount >= this.maxRetries) {
      console.warn('[ErrorBoundary] Max retries reached, preventing further resets');
      return;
    }

    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Icon name="alert-circle" size={64} color="#EF4444" strokeWidth={2} />
            </View>

            <Text style={styles.title}>Something went wrong</Text>

            <Text style={styles.message}>
              We&apos;re sorry for the inconvenience. The app encountered an unexpected error.
            </Text>

            {this.retryCount >= this.maxRetries - 1 && (
              <Text style={styles.retryWarning}>
                Multiple errors detected. Please restart the app if this continues.
              </Text>
            )}

            {__DEV__ && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details:</Text>
                <Text style={styles.errorText}>{this.state.error.message}</Text>
              </View>
            )}

            <Button
              title="Try again"
              onPress={this.resetError}
              className="absolute bottom-0 w-full"
            />
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    position: 'relative',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#070914',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  errorDetails: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#991B1B',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  retryWarning: {
    fontSize: 14,
    color: '#F59E0B',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
});
