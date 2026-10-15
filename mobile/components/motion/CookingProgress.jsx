import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from './MotionProvider';
import SuccessMoment from './SuccessMoment';
import { EDITORIAL_COLORS as E } from '../../constants/editorialTheme';

export default function CookingProgress({ completed, total }) {
  const reduced = useReducedMotion();
  const ratio = total ? Math.min(1, Math.max(0, completed / total)) : 0;
  const [progress] = useState(() => new Animated.Value(ratio));
  useEffect(() => {
    progress.stopAnimation();
    const animation = Animated.timing(progress, { toValue: ratio, duration: reduced ? 0 : 240, useNativeDriver: false });
    animation.start();
    return () => animation.stop();
  }, [ratio, reduced, progress]);
  if (!total) return null;
  return <View style={s.container}>
    <Text style={s.label}>{completed} of {total} cooking steps checked</Text>
    <View accessibilityRole="progressbar" accessibilityLabel="Cooking steps" accessibilityValue={{ min: 0, max: total, now: completed }} aria-valuemin={0} aria-valuemax={total} aria-valuenow={completed} style={s.track}>
      <Animated.View style={[s.fill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
    </View>
    {completed === total && <SuccessMoment message="All steps checked. Enjoy your dish!" />}
  </View>;
}
const s = StyleSheet.create({ container: { gap: 12, marginBottom: 20 }, label: { color: E.muted, fontSize: 13 }, track: { height: 6, borderRadius: 3, backgroundColor: E.line, overflow: 'hidden' }, fill: { height: 6, borderRadius: 3, backgroundColor: E.green } });
