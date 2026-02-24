export const MOTION = {
  spring: {
    default: { damping: 12, stiffness: 120 },
    bouncy: { damping: 8, stiffness: 100 },
    gentle: { damping: 15, stiffness: 80 },
  },
  timing: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
  stagger: {
    delay: 50,
    delayLong: 80,
  },
  confetti: {
    count: 50,
    countLarge: 60,
    duration: { min: 3000, max: 5000 },
    colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA', '#F472B6', '#34D399', '#60A5FA'],
  },
} as const;
