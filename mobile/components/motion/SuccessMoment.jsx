import { useCallback, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import KitchenCompanion from '../chef/KitchenCompanion';
import { useReducedMotion } from './MotionProvider';
import { EDITORIAL_COLORS as E } from '../../constants/editorialTheme';

export default function SuccessMoment({ message }) {
  const reduced = useReducedMotion();
  const [burst] = useState(() => new Animated.Value(0));
  useFocusEffect(useCallback(() => {
    burst.stopAnimation(); burst.setValue(0);
    if (reduced) return;
    const animation = Animated.timing(burst, { toValue: 1, duration: 700, useNativeDriver: true, isInteraction: false });
    animation.start();
    return () => { animation.stop(); burst.setValue(0); };
  }, [burst, reduced]));
  return <View style={s.container} accessibilityLiveRegion="polite">
    <View style={s.character}><KitchenCompanion size={44} mood="celebrate" />
      {!reduced && <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFillObject}>
        {[-145, -105, -60, -20, 30, 160].map((angle, index) => <Animated.View key={angle} style={{ position: 'absolute', top: 22, left: 21, width: 4, height: 7, borderRadius: 2, backgroundColor: index % 2 ? E.gold : E.green,
          opacity: burst.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 0.8, 0] }),
          transform: [{ translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle * Math.PI / 180) * 35] }) }, { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle * Math.PI / 180) * 30] }) }, { rotate: `${angle}deg` }],
        }} />)}
      </View>}
    </View><Text style={s.message}>{message}</Text>
  </View>;
}
const s = StyleSheet.create({ container: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: E.sage, borderRadius: 16 }, character: { width: 44, height: 48 }, message: { flex: 1, color: E.green, fontWeight: '600', fontSize: 14, lineHeight: 21 } });
