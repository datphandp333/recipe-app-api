import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useReducedMotion } from './MotionProvider';

const AnimatedPath = Animated.createAnimatedComponent(Path);
// The 24-unit check is drawn only when a person checks a cooking step.
export default function CookingCheck({ checked, color, size = 22 }) {
  const reduced = useReducedMotion();
  const previous = useRef(checked);
  const [draw] = useState(() => new Animated.Value(checked ? 1 : 0));
  const [scale] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const added = checked && !previous.current;
    previous.current = checked;
    draw.stopAnimation(); scale.stopAnimation(); scale.setValue(1);
    if (reduced || !added) { draw.setValue(checked ? 1 : 0); return; }
    draw.setValue(0);
    const animation = Animated.parallel([
      Animated.timing(draw, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: false, isInteraction: false }),
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.12, duration: 90, useNativeDriver: true, isInteraction: false }),
        Animated.spring(scale, { toValue: 1, stiffness: 380, damping: 24, mass: 0.6, useNativeDriver: true, isInteraction: false }),
      ]),
    ]);
    animation.start();
    return () => animation.stop();
  }, [checked, reduced, draw, scale]);
  return <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, transform: [{ scale }] }}>
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {!checked && <Circle cx={12} cy={12} r={8} stroke={color} strokeWidth={1.6} fill="none" opacity={0.65} />}
      <AnimatedPath d="M4 12L9 17L20 6" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24 24" strokeDashoffset={draw.interpolate({ inputRange: [0, 1], outputRange: [24, 0] })} opacity={checked ? 1 : 0} />
    </Svg>
  </Animated.View>;
}
