import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Text } from 'react-native';

interface Props {
  text: string;
  speed?: number;
  onComplete?: () => void;
  style?: any;
  children?: (displayed: string) => React.ReactNode;
}

/**
 * Reveals text with a smooth typewriter effect.
 * Batches multiple characters per frame for performance.
 * Adapts speed based on content length — short responses type faster.
 */
export function TypingText({ text, speed = 12, onComplete, style, children }: Props) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const completedRef = useRef(false);

  const animate = useCallback((timestamp: number) => {
    if (completedRef.current) return;

    const elapsed = timestamp - lastTimeRef.current;
    // Adaptive: type faster for longer texts, batch more chars per frame
    const charsPerTick = text.length > 500 ? 3 : text.length > 200 ? 2 : 1;
    const interval = speed;

    if (elapsed >= interval) {
      lastTimeRef.current = timestamp;
      const nextIndex = Math.min(indexRef.current + charsPerTick, text.length);

      // Skip ahead through whitespace for natural pacing
      let finalIndex = nextIndex;
      while (finalIndex < text.length && finalIndex < nextIndex + 2 && text[finalIndex] === ' ') {
        finalIndex++;
      }

      indexRef.current = finalIndex;
      setDisplayed(text.slice(0, finalIndex));

      if (finalIndex >= text.length) {
        completedRef.current = true;
        onComplete?.();
        return;
      }
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [text, speed, onComplete]);

  useEffect(() => {
    indexRef.current = 0;
    completedRef.current = false;
    setDisplayed('');
    lastTimeRef.current = 0;

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [text, animate]);

  if (children) return <>{children(displayed)}</>;
  return <Text style={style}>{displayed}</Text>;
}
