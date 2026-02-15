import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from './atoms/Icon';
import { logger } from '../lib/logger';
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
    // Log error details with context
    const errorMessage = error?.message || String(error);
    const errorStack = error?.stack || 'No stack trace';

    safeError('[ErrorBoundary] Caught error:', {
      message: errorMessage,
      name: error?.name,
      stack: errorStack.substring(0, 200),
    });
    safeError('[ErrorBoundary] Error info:', errorInfo);

    // Log to console with full details for debugging
    if (__DEV__) {
      console.error('[ErrorBoundary] Full error:', error);
      console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    }

    if (!__DEV__) {
      try {
        Sentry.captureException(error, {
          contexts: {
            react: { componentStack: errorInfo.componentStack },
            app: {
              retryCount: this.retryCount,
              timestamp: new Date().toISOString(),
            },
          },
          tags: {
            component: 'ErrorBoundary',
            severity: 'error',
          },
        });
      } catch (sentryError) {
        logger.error(
          '[ErrorBoundary] Failed to send to Sentry',
          sentryError instanceof Error ? sentryError : new Error(String(sentryError))
        );
      }
    }
  }

  resetError = (): void => {
    this.retryCount++;

    if (this.retryCount >= this.maxRetries) {
      logger.warn('[ErrorBoundary] Max retries reached, preventing further resets', {
        component: 'ErrorBoundary',
        action: 'max-retries-reached',
        retryCount: this.retryCount,
      });
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
                <Text style={styles.errorText} numberOfLines={5}>
                  {this.state.error.message?.substring(0, 200) || 'Unknown error'}
                </Text>
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
