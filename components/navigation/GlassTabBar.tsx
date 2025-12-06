import React from 'react';
import { Platform, StyleSheet, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  GlassEffectContainer,
  Group,
  Host,
  HStack,
  Image,
  Namespace,
  Spacer,
  ZStack,
} from '@expo/ui/swift-ui';
import {
  Animation,
  animation,
  frame,
  glassEffect,
  glassEffectId,
  matchedGeometryEffect,
  onLongPressGesture,
  opacity,
  padding,
  scaleEffect,
  shadow,
} from '@expo/ui/swift-ui/modifiers';
import type { SFSymbol } from 'sf-symbols-typescript';

type TabDefinition = {
  icon: SFSymbol;
  title: string;
  indicatorTint: string;
  indicatorShadow: string;
};

const TAB_CONFIG: Record<string, TabDefinition> = {
  index: {
    icon: 'house.fill',
    title: 'Home',
    indicatorTint: 'rgba(16, 206, 134, 0.78)',
    indicatorShadow: 'rgba(16, 206, 134, 0.45)',
  },
  invest: {
    icon: 'chart.line.uptrend.xyaxis',
    title: 'Invest',
    indicatorTint: 'rgba(12, 214, 246, 0.78)',
    indicatorShadow: 'rgba(12, 214, 246, 0.42)',
  },
  card: {
    icon: 'creditcard.fill',
    title: 'Card',
    indicatorTint: 'rgba(255, 194, 46, 0.78)',
    indicatorShadow: 'rgba(255, 194, 46, 0.48)',
  },
  profile: {
    icon: 'person.crop.circle',
    title: 'Profile',
    indicatorTint: 'rgba(255, 149, 79, 0.78)',
    indicatorShadow: 'rgba(255, 149, 79, 0.42)',
  },
};

const highlightAnimation = Animation.interpolatingSpring({
  mass: 0.72,
  stiffness: 165,
  damping: 18,
});

const iconAnimation = Animation.spring({
  response: 0.32,
  dampingFraction: 0.78,
});

export function GlassTabBar(props: BottomTabBarProps) {
  const { state, descriptors, navigation } = props;
  const insets = useSafeAreaInsets();
  const namespaceId = React.useId();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const shellTint = isDark ? 'rgba(15, 23, 42, 0.55)' : 'rgba(255, 255, 255, 0.7)';
  const shellShadow = shadow({
    radius: 42,
    y: 24,
    color: isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(15, 23, 42, 0.14)',
  });
  const iconActive = isDark ? '#f9fafb' : '#111827';
  const iconInactive = isDark ? 'rgba(226, 232, 240, 0.68)' : 'rgba(55, 65, 81, 0.65)';
  const activeIndexValue = state.index;

  if (Platform.OS !== 'ios') {
    return <BottomTabBar {...props} />;
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}>
      <Host style={styles.host} colorScheme={scheme ?? 'light'}>
        <Namespace id={namespaceId}>
          <GlassEffectContainer spacing={24}>
            <HStack
              spacing={18}
              alignment="center"
              modifiers={[
                glassEffect({
                  glass: {
                    variant: 'regular',
                    tint: shellTint,
                    interactive: true,
                  },
                  shape: 'capsule',
                }),
                glassEffectId('tabbar-shell', namespaceId),
                padding({ horizontal: 22, vertical: 14 }),
                frame({ maxWidth: 640 }),
                shellShadow,
              ]}>
              {state.routes.map((route, index) => {
                const isFocused = activeIndexValue === index;
                const options = descriptors[route.key]?.options ?? {};
                const config = TAB_CONFIG[route.name] ?? {
                  icon: 'square.fill' as SFSymbol,
                  title:
                    typeof options.tabBarLabel === 'string'
                      ? options.tabBarLabel
                      : options.title ?? route.name,
                  indicatorTint: 'rgba(148, 163, 184, 0.6)',
                  indicatorShadow: 'rgba(148, 163, 184, 0.35)',
                };

                const onPress = () => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });

                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name, route.params);
                  }
                };

                const onLongPress = () => {
                  navigation.emit({
                    type: 'tabLongPress',
                    target: route.key,
                  });
                };

                const tabTestID =
                  options.tabBarButtonTestID ??
                  (typeof (options as { tabBarTestID?: string }).tabBarTestID === 'string'
                    ? (options as { tabBarTestID?: string }).tabBarTestID
                    : undefined);

                return (
                  <Group
                    key={route.key}
                    onPress={onPress}
                    testID={tabTestID}
                    modifiers={[
                      glassEffect({
                        glass: {
                          variant: 'clear',
                          interactive: true,
                        },
                        shape: 'capsule',
                      }),
                      glassEffectId(route.key, namespaceId),
                      padding({ horizontal: 12, vertical: 10 }),
                      opacity(isFocused ? 1 : 0.96),
                      animation(iconAnimation, isFocused),
                      onLongPressGesture(onLongPress, 0.45),
                    ]}>
                    <ZStack alignment="center">
                      {isFocused ? (
                        <Group
                          modifiers={[
                            matchedGeometryEffect('tabbar-indicator', namespaceId),
                            glassEffect({
                              glass: {
                                variant: 'regular',
                                tint: config.indicatorTint,
                                interactive: true,
                              },
                              shape: 'capsule',
                            }),
                            glassEffectId('tabbar-indicator', namespaceId),
                            padding({ horizontal: 32, vertical: 18 }),
                            shadow({
                              radius: 36,
                              y: 18,
                              color: config.indicatorShadow,
                            }),
                            animation(highlightAnimation, activeIndexValue),
                          ]}>
                          <Spacer minLength={0} />
                        </Group>
                      ) : null}

                      <Image
                        systemName={config.icon}
                        size={22}
                        color={isFocused ? iconActive : iconInactive}
                        modifiers={[
                          scaleEffect(isFocused ? 1 : 0.9),
                          animation(iconAnimation, isFocused),
                        ]}
                      />
                    </ZStack>
                  </Group>
                );
              })}
            </HStack>
          </GlassEffectContainer>
        </Namespace>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  host: {
    width: '100%',
  },
});
