import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { useReducedMotion } from './MotionProvider';

export default function SelectionPulse({ selected, children }) {
  const reduced = useReducedMotion();
  const previous = useRef(selected);
  const [scale] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const newlySelected = selected && !previous.current;
    previous.current = selected;
    scale.stopAnimation();
    scale.setValue(1);
    if (reduced || !newlySelected) return;
    const animation = Animated.sequence([
      Animated.timing(scale, { toValue: 1.14, duration: 100, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, stiffness: 420, damping: 24, mass: 0.6, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [selected, reduced, scale]);
  return <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>;
}
