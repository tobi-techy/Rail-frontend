import React, { useEffect, useRef, useState } from 'react';

interface Props {
  text: string;
  speed?: number;
  batchSize?: number;
  onComplete?: () => void;
  children: (displayed: string) => React.ReactNode;
}

export function TypingText({ text, speed = 16, batchSize, onComplete, children }: Props) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Ref so the interval always calls the latest onComplete without restarting
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed('');

    const batch = batchSize ?? (text.length > 600 ? 4 : text.length > 200 ? 2 : 1);

    timerRef.current = setInterval(() => {
      const next = Math.min(indexRef.current + batch, text.length);
      indexRef.current = next;
      setDisplayed(text.slice(0, next));

      if (next >= text.length) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        onCompleteRef.current?.();
      }
    }, speed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [text, speed, batchSize]);

  return <>{children(displayed)}</>;
}
