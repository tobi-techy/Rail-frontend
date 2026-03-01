import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { useKycStore } from '@/stores/kycStore';
import { kycService } from '@/api/services';

function buildSumsubHtml(token: string, applicantId: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { background: #fff; height: 100%; overflow: hidden; }
    #sumsub-websdk-container { height: 100%; display: flex; flex-direction: column; }
  </style>
</head>
<body>
  <div id="sumsub-websdk-container"></div>
  <script src="https://static.sumsub.com/idensic/static/sns-websdk-builder.js"></script>
  <script>
    // RN will post a new token here when token_refresh_response arrives
    var pendingTokenResolve = null;

    function getNewToken() {
      return new Promise(function(resolve) {
        pendingTokenResolve = resolve;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'token_expired' }));
      });
    }

    document.addEventListener('message', function(e) {
      try {
        var msg = JSON.parse(e.data);
        if (msg.type === 'token_refresh_response' && pendingTokenResolve) {
          pendingTokenResolve(msg.token);
          pendingTokenResolve = null;
        }
      } catch(err) {}
    });

    var snsWebSdkInstance = snsWebSdk
      .init('${token}', getNewToken)
      .withConf({ lang: 'en', applicantId: '${applicantId}' })
      .withOptions({ addViewportTag: false, adaptIframeHeight: true })
      .on('idCheck.onStepCompleted', function(payload) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'step_completed', payload: payload }));
      })
      .on('idCheck.onApplicantStatusChanged', function(payload) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'status_changed', payload: payload }));
      })
      .on('idCheck.onApplicantSubmitted', function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'submitted' }));
      })
      .on('idCheck.onError', function(error) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: error }));
      })
      .build();

    snsWebSdkInstance.launch('#sumsub-websdk-container');
  </script>
</body>
</html>
  `.trim();
}

export default function KycSumsubSdkScreen() {
  const { sumsubToken, applicantId, setSumsubSession } = useKycStore();
  const [loading, setLoading] = useState(true);
  const [sdkError, setSdkError] = useState(false);
  const hasNavigated = useRef(false);
  const webViewRef = useRef<WebView>(null);

  const handleMessage = useCallback(
    async (event: WebViewMessageEvent) => {
      if (hasNavigated.current) return;
      try {
        const msg = JSON.parse(event.nativeEvent.data) as { type: string };

        if (msg.type === 'submitted' || msg.type === 'status_changed') {
          hasNavigated.current = true;
          router.replace('/kyc/pending');
        } else if (msg.type === 'error') {
          setSdkError(true);
        } else if (msg.type === 'token_expired') {
          // Fetch a fresh session token and post it back into the WebView
          try {
            const { token, applicant_id } = await kycService.refreshSumsubToken();
            setSumsubSession(token, applicant_id);
            webViewRef.current?.injectJavaScript(
              `document.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({ type: 'token_refresh_response', token: '${token}' }) })); true;`
            );
          } catch {
            setSdkError(true);
          }
        }
      } catch {
        // ignore malformed messages
      }
    },
    [setSumsubSession]
  );

  const handleClose = useCallback(() => router.back(), []);

  if (!sumsubToken || !applicantId) return null;

  const html = buildSumsubHtml(sumsubToken, applicantId);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between px-4 pb-2 pt-1">
        <View className="size-11" />
        <Text className="font-subtitle text-[13px] text-gray-500">Identity scan</Text>
        <Pressable
          className="size-11 items-center justify-center"
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close identity scan">
          <X size={22} color="#111827" />
        </Pressable>
      </View>

      {sdkError ? (
        <View className="flex-1 items-center justify-center px-8 gap-4">
          <Text className="font-subtitle text-[16px] text-gray-900 text-center">
            Something went wrong
          </Text>
          <Text className="font-body text-[14px] text-gray-500 text-center">
            The identity scan could not be loaded. Please go back and try again.
          </Text>
          <Pressable
            onPress={handleClose}
            className="mt-2 rounded-full bg-gray-900 px-6 py-3"
            accessibilityRole="button">
            <Text className="font-subtitle text-[14px] text-white">Go back</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {loading && (
            <View className="absolute inset-0 items-center justify-center bg-white z-10">
              <ActivityIndicator size="large" color="#111827" />
              <Text className="mt-3 font-body text-[14px] text-gray-500">
                Loading identity scan…
              </Text>
            </View>
          )}
          <WebView
            ref={webViewRef}
            className="flex-1"
            source={{ html }}
            onLoadEnd={() => setLoading(false)}
            onMessage={handleMessage}
            onError={() => setSdkError(true)}
            javaScriptEnabled
            domStorageEnabled
            mediaCapturePermissionGrantType="grant"
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback
            mixedContentMode="always"
            originWhitelist={['*']}
          />
        </>
      )}
    </SafeAreaView>
  );
}
