import React, { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';

interface Props {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  style?: any;
}

export function AnimatedBalance({ value, prefix = '$', suffix = '', decimals = 2, duration = 600, style }: Props) {
  const [display, setDisplay] = useState(`${prefix}${value.toFixed(decimals)}${suffix}`);
  const prevRef = useRef(value);

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    prevRef.current = value;
    if (start === end) return;

    const startTime = Date.now();
    let raf: number;
    const tick = () => {
      const progress = Math.min((Date.now() - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(`${prefix}${(start + (end - start) * eased).toFixed(decimals)}${suffix}`);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, prefix, suffix, decimals, duration]);

  return <Text style={style}>{display}</Text>;
}
