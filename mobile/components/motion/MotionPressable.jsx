import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { useReducedMotion } from './MotionProvider';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
export default function MotionPressable({ style, onPressIn, onPressOut, activeOpacity = 0.94, disabled, ...props }) {
  const reduced = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const [scale] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (reduced || disabled) { scale.stopAnimation(); scale.setValue(1); }
    return () => scale.stopAnimation();
  }, [reduced, disabled, scale]);
  const animate = value => {
    if (reduced || disabled) return;
    scale.stopAnimation();
    Animated.spring(scale, { toValue: value, stiffness: 420, damping: 28, mass: 0.6, useNativeDriver: true }).start();
  };
  const base = typeof style === 'function' ? style({ pressed: pressed && !disabled }) : style;
  const transforms = StyleSheet.flatten(base)?.transform || [];
  return <AnimatedPressable {...props} disabled={disabled} style={[base,
    pressed && !disabled && { opacity: activeOpacity },
    !reduced && { transform: [...transforms, { scale }] },
  ]} onPressIn={event => { setPressed(true); animate(0.97); onPressIn?.(event); }}
    onPressOut={event => { setPressed(false); animate(1); onPressOut?.(event); }} />;
}
