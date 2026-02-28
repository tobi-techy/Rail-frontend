import React, { memo, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { SlideContent } from './SlideContent';
import type { OnboardingSlide } from './onboardingSlides';

interface Props {
  item: OnboardingSlide;
  width: number;
  height: number;
  topInset: number;
  isCompactWidth: boolean;
}

export const ActiveVideoSlide = memo(function ActiveVideoSlide({
  item,
  width,
  height,
  topInset,
  isCompactWidth,
}: Props) {
  const [firstFrameRendered, setFirstFrameRendered] = useState(false);
  const player = useVideoPlayer(item.video, (p) => {
    p.loop = true;
    p.muted = true;
  });

  useEffect(() => {
    setFirstFrameRendered(false);
  }, [item.key]);

  useEffect(() => {
    const fallback = setTimeout(() => setFirstFrameRendered(true), 1500);
    player.play();
    return () => {
      clearTimeout(fallback);
      player.pause();
    };
  }, [item.key, player]);

  return (
    <View className="flex-1 overflow-hidden bg-black" style={{ width }}>
      <VideoView
        player={player}
        style={{ width, height, position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        contentFit="cover"
        nativeControls={false}
        onFirstFrameRender={() => setFirstFrameRendered(true)}
        useExoShutter={false}
      />
      {!firstFrameRendered && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            width,
            height,
            backgroundColor: '#000000',
            zIndex: 5,
          }}
        />
      )}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          width,
          height,
          backgroundColor: 'rgba(0,0,0,0.48)',
          zIndex: 6,
        }}
      />
      <SlideContent item={item} topInset={topInset} isCompactWidth={isCompactWidth} />
    </View>
  );
});
