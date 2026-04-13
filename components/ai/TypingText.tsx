import React, { useEffect, useState, useRef } from 'react';
import { Text } from 'react-native';

interface Props {
  text: string;
  speed?: number;
  onComplete?: () => void;
  style?: any;
  children?: (displayed: string) => React.ReactNode;
}

/**
 * Reveals text character-by-character with a typing effect.
 * If `children` is a render function, it receives the displayed text
 * so the parent can render it with markdown or custom styling.
 */
export function TypingText({ text, speed = 12, onComplete, style, children }: Props) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed('');

    timerRef.current = setInterval(() => {
      indexRef.current += 1;
      const next = text.slice(0, indexRef.current);
      setDisplayed(next);

      if (indexRef.current >= text.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        onComplete?.();
      }
    }, speed);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [text, speed, onComplete]);

  if (children) return <>{children(displayed)}</>;
  return <Text style={style}>{displayed}</Text>;
}
