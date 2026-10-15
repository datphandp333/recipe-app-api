import { useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useReducedMotion } from './MotionProvider';

export default function DisclosureChevron({ expanded, color, size = 20 }) {
  const reduced = useReducedMotion();
  const [rotation] = useState(() => new Animated.Value(expanded ? 1 : 0));
  useEffect(() => {
    rotation.stopAnimation();
    if (reduced) { rotation.setValue(expanded ? 1 : 0); return; }
    const animation = Animated.spring(rotation, { toValue: expanded ? 1 : 0, stiffness: 320, damping: 28, mass: 0.7, useNativeDriver: true, isInteraction: false });
    animation.start();
    return () => animation.stop();
  }, [expanded, reduced, rotation]);
  return <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ transform: [{ rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}><Ionicons name="chevron-down" size={size} color={color} /></Animated.View>;
}
