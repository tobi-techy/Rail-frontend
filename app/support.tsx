import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Pressable, Platform, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import Animated, { FadeIn } from 'react-native-reanimated';
import { IconComponent as HugeiconsIcon, Cancel01Icon, Message01Icon } from '@/lib/icons';
import { useFeedbackPopupStore } from '@/stores/feedbackPopupStore';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import { useAuthStore } from '@/stores/authStore';
import { aiService } from '@/api/services/ai.service';
import { logger } from '@/lib/logger';

// ─── HTML Template ──────────────────────────────────────────────────────────

function buildWidgetHTML(signedUrl: string, dynamicVariables: Record<string, string>) {
  const varsJSON = JSON.stringify(dynamicVariables);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      background: #FAFAF7;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
    }
    .container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    elevenlabs-convai {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <div class="container">
    <elevenlabs-convai
      signed-url="${signedUrl}"
      server-location="us"
      variant="full"
      dismissible="false"
      avatar-orb-color-1="#FF2E01"
      avatar-orb-color-2="#FF6B4A"
      action-text="Need help?"
      start-call-text="Start call"
      end-call-text="End call"
      expand-text="Open chat"
      collapse-text="Close"
      listening-text="Listening..."
      speaking-text="Speaking"
      dynamic-variables='${varsJSON}'
      markdown-link-allowed-hosts="*"
    ></elevenlabs-convai>
  </div>
  <script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>
  <script>
    // Forward widget events to React Native
    document.addEventListener('DOMContentLoaded', function() {
      var widget = document.querySelector('elevenlabs-convai');
      if (!widget) return;

      widget.addEventListener('elevenlabs-convai:call', function(event) {
        // Inject client tools for human handoff
        event.detail.config.clientTools = {
          redirectToEmailSupport: function(params) {
            var subject = encodeURIComponent(params.subject || 'Rail Support Request');
            var body = encodeURIComponent(params.body || '');
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'openEmail',
              url: 'mailto:support@userail.money?subject=' + subject + '&body=' + body
            }));
          }
        };
      });

      widget.addEventListener('conversationStarted', function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'connected' }));
      });

      widget.addEventListener('conversationEnded', function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'disconnected' }));
      });
    });
  </script>
</body>
</html>`;
}

// ─── Main ───────────────────────────────────────────────────────────────────

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { impact, notification } = useHaptics();
  const showPopup = useFeedbackPopupStore((s) => s.showPopup);
  const user = useAuthStore((s) => s.user);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  const dynamicVariables = useMemo(
    () => ({
      user_id: user?.id ?? 'anonymous',
      user_email: user?.email ?? '',
      user_name: user?.firstName
        ? `${user.firstName} ${user.lastName ?? ''}`.trim()
        : (user?.email ?? 'User'),
      platform: Platform.OS,
    }),
    [user]
  );

  // Fetch signed URL on mount
  useEffect(() => {
    let cancelled = false;

    const fetchSignedUrl = async () => {
      try {
        const result = await aiService.getSupportSignedUrl();
        if (cancelled) return;
        setSignedUrl(result.signed_url);
        setIsLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        const status = e?.status ?? e?.response?.status;
        const msg =
          status === 404
            ? 'Support is not available in this environment.'
            : 'Could not connect to support. Please try again.';
        logger.error('[Support] Failed to fetch signed URL', {
          error: e instanceof Error ? e.message : String(e),
          status,
        });
        setError(msg);
        setIsLoading(false);
      }
    };

    fetchSignedUrl();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleClose = useCallback(() => {
    playUISound('buttonClick');
    impact();
    router.back();
  }, [impact, router]);

  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        switch (data.type) {
          case 'connected':
            notification('success');
            break;
          case 'disconnected':
            break;
          case 'openEmail': {
            // Can't open mailto in WebView — navigate back and let the app handle it
            // For now, show a popup with the support email
            showPopup({
              type: 'info',
              title: 'Email Support',
              message: 'Reach us at support@userail.money',
            });
            break;
          }
        }
      } catch {
        // Ignore non-JSON messages
      }
    },
    [notification, showPopup]
  );

  const handleWebViewError = useCallback(() => {
    logger.error('[Support] WebView error');
    setError('Something went wrong. Please try again.');
  }, []);

  const htmlContent = useMemo(
    () => (signedUrl ? buildWidgetHTML(signedUrl, dynamicVariables) : null),
    [signedUrl, dynamicVariables]
  );

  return (
    <View
      className="flex-1 bg-[#FAFAF7]"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <View className="flex-row items-center gap-2">
          <HugeiconsIcon icon={Message01Icon} size={18} color="#FF2E01" />
          <Text
            className="text-[16px] font-semibold text-charcoal-primary"
            maxFontSizeMultiplier={1.3}>
            Support
          </Text>
        </View>
        <Pressable
          onPress={handleClose}
          hitSlop={12}
          className="h-10 w-10 items-center justify-center rounded-full bg-[#F0F0EE]"
          accessibilityRole="button"
          accessibilityLabel="Close">
          <HugeiconsIcon icon={Cancel01Icon} size={18} color="#1C1C1E" />
        </Pressable>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF2E01" />
          <Text className="mt-4 text-[14px] text-[#8C8C8C]" maxFontSizeMultiplier={1.3}>
            Connecting to support…
          </Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-[15px] text-[#8C8C8C]" maxFontSizeMultiplier={1.3}>
            {error}
          </Text>
          <Pressable
            onPress={handleClose}
            className="mt-6 rounded-full bg-[#FF2E01] px-6 py-3"
            accessibilityRole="button">
            <Text className="text-[15px] font-semibold text-white" maxFontSizeMultiplier={1.3}>
              Go Back
            </Text>
          </Pressable>
        </View>
      ) : htmlContent ? (
        <Animated.View entering={FadeIn.duration(300)} style={styles.webViewContainer}>
          <WebView
            source={{ html: htmlContent }}
            style={styles.webView}
            onMessage={handleWebViewMessage}
            onError={handleWebViewError}
            onHttpError={handleWebViewError}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback
            allowsBackForwardNavigationGestures={false}
            bounces={false}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            onShouldStartLoadWithRequest={() => true}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  webViewContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
