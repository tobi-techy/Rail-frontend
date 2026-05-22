import React, { useState, useRef, useCallback } from 'react';
import { View, Text, Image, Dimensions, Pressable } from 'react-native';
import { GorhomBottomSheet } from './GorhomBottomSheet';
import { Button } from '@/components/ui';
import { WebView } from 'react-native-webview';
import { virtualAccountService } from '@/api/services/virtualAccount.service';
import { logger } from '@/lib/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface InvestmentDisclaimerSheetProps {
  visible: boolean;
  onAccept: () => void;
}

const AUTO_ACCEPT_JS = `
  (function() {
    function tryAccept() {
      var btn = document.querySelector('button[type="submit"], input[type="submit"]');
      if (!btn) btn = Array.from(document.querySelectorAll('button')).find(function(b) {
        return /accept|agree|confirm|submit/i.test(b.textContent);
      });
      if (btn) { btn.click(); return; }
      setTimeout(tryAccept, 500);
    }
    if (document.readyState === 'complete') tryAccept();
    else window.addEventListener('load', tryAccept);
  })();
  true;
`;

export function InvestmentDisclaimerSheet({ visible, onAccept }: InvestmentDisclaimerSheetProps) {
  const [loading, setLoading] = useState(false);
  const [tosUrl, setTosUrl] = useState<string | null>(null);
  const tosResolveRef = useRef<(() => void) | null>(null);

  const handleTosComplete = useCallback(() => {
    if (!tosResolveRef.current) return;
    const resolve = tosResolveRef.current;
    tosResolveRef.current = null;
    setTosUrl(null);
    resolve();
  }, []);

  const handleAccept = useCallback(async () => {
    setLoading(true);
    try {
      const res = await virtualAccountService.getTOSLink();
      const url = res?.tos_link;
      if (url) {
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(resolve, 8000);
          tosResolveRef.current = () => {
            clearTimeout(timeout);
            resolve();
          };
          setTosUrl(url);
        });
      }
    } catch (error) {
      logger.warn('[Disclaimer] Failed to accept Bridge TOS', {
        component: 'InvestmentDisclaimerSheet',
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
      setTosUrl(null);
      tosResolveRef.current = null;
      onAccept();
    }
  }, [onAccept]);

  return (
    <GorhomBottomSheet
      visible={visible}
      onClose={onAccept}
      showCloseButton={false}
      dismissible={false}
      scrollable={false}>
      <View>
        {/* Edge-to-edge image */}
        <View style={{ marginHorizontal: -20, marginTop: -8 }}>
          <Image
            source={require('@/assets/images/onboard-slide-1.jpg')}
            style={{ width: SCREEN_WIDTH, height: 280 }}
            resizeMode="cover"
          />
        </View>

        {/* Title */}
        <Text className="mt-5 font-subtitle text-[20px] text-charcoal-primary">
          Your Money, On Autopilot
        </Text>

        {/* Description */}
        <Text className="mt-3 font-body text-[15px] leading-[22px] text-graphite">
          Every deposit is instantly split — 70% to Spend, 30% to Stash. Your stash earns yield
          automatically. No buttons, no decisions. Your money starts working the moment it arrives.
        </Text>

        {/* Buttons */}
        <View className="mt-6 flex-row gap-3">
          <Pressable
            onPress={onAccept}
            className="flex-1 items-center justify-center rounded-full bg-ash/10 py-4">
            <Text className="font-button text-[15px] text-charcoal-primary">Maybe later</Text>
          </Pressable>
          <View className="flex-1">
            <Button
              title={loading ? 'Setting up…' : 'Get Started'}
              onPress={handleAccept}
              disabled={loading}
            />
          </View>
        </View>

        {/* Hidden WebView for silent TOS acceptance */}
        {tosUrl && (
          <View style={{ height: 0, width: 0, overflow: 'hidden' }}>
            <WebView
              source={{ uri: tosUrl }}
              injectedJavaScript={AUTO_ACCEPT_JS}
              javaScriptEnabled
              onNavigationStateChange={(navState) => {
                if (
                  navState.url?.includes('signed_agreement_id') ||
                  (navState.url &&
                    !navState.url.includes('accept-terms-of-service') &&
                    navState.loading === false)
                ) {
                  handleTosComplete();
                }
              }}
              onError={() => handleTosComplete()}
              onHttpError={() => handleTosComplete()}
            />
          </View>
        )}
      </View>
    </GorhomBottomSheet>
  );
}
