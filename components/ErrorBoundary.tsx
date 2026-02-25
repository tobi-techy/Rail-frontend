import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle } from 'lucide-react-native';
import { logger } from '../lib/logger';
import { safeError } from '../utils/logSanitizer';
import { Sentry } from '../lib/sentry';

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
      // Only include stack in dev — avoid leaking component tree in production
      stack: __DEV__ ? errorStack.substring(0, 200) : undefined,
    });

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
            {/* Icon — top left, Klarna-style */}
            <View style={styles.iconWrap}>
              <AlertTriangle size={64} color="#0A0A0A" strokeWidth={1.5} />
            </View>

            <Text style={styles.title}>Something went wrong.</Text>
            <Text style={styles.message}>
              An unexpected error occurred. Your data is safe — try again or restart the app.
            </Text>

            {__DEV__ && (
              <View style={styles.devBox}>
                <Text style={styles.devText} numberOfLines={4}>
                  {this.state.error.message?.substring(0, 200) || 'Unknown error'}
                </Text>
              </View>
            )}
          </View>

          {/* CTA pinned to bottom */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.button} onPress={this.resetError} activeOpacity={0.85}>
              <Text style={styles.buttonText}>Try again</Text>
            </TouchableOpacity>
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
    paddingHorizontal: 28,
    paddingTop: 24,
  },
  iconWrap: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0A0A0A',
    marginBottom: 12,
    lineHeight: 34,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  devBox: {
    marginTop: 24,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 10,
  },
  devText: {
    fontSize: 11,
    color: '#991B1B',
    fontFamily: 'monospace',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  button: {
    backgroundColor: '#0A0A0A',
    paddingVertical: 18,
    borderRadius: 100,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
