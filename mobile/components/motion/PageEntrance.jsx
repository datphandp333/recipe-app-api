import { useCallback, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useReducedMotion } from './MotionProvider';

export default function PageEntrance({ children, style }) {
  const reduced = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(reduced ? 1 : 0));
  useFocusEffect(useCallback(() => {
    progress.stopAnimation();
    if (reduced) { progress.setValue(1); return; }
    progress.setValue(0);
    const animation = Animated.timing(progress, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start();
    return () => { animation.stop(); progress.setValue(1); };
  }, [reduced, progress]));
  return <Animated.View style={[{ flex: 1 }, style, !reduced && {
    opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }),
    transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
  }]}>{children}</Animated.View>;
}
