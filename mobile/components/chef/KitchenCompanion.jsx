import { useCallback, useEffect, useState } from 'react';
import { Animated, AppState, Easing, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { useReducedMotion } from '../motion/MotionProvider';

// Original vector character. All parts stay inside the 120 x 130 canvas.
export default function KitchenCompanion({ size = 72, mood = 'welcome' }) {
  const reduced = useReducedMotion();
  const [appActive, setAppActive] = useState(AppState.currentState === 'active' || AppState.currentState == null);
  const [steam] = useState(() => new Animated.Value(0));
  const [gesture] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => setAppActive(state === 'active'));
    return () => listener.remove();
  }, []);
  useFocusEffect(useCallback(() => {
    steam.stopAnimation(); gesture.stopAnimation(); steam.setValue(0); gesture.setValue(0);
    if (reduced || !appActive) return;
    const rise = Animated.timing(steam, { toValue: 1, duration: mood === 'thinking' ? 1600 : 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true, isInteraction: false });
    const steamAnimation = mood === 'thinking' ? Animated.loop(Animated.sequence([rise, Animated.delay(160)])) : rise;
    const greeting = Animated.timing(gesture, { toValue: 1, duration: mood === 'celebrate' ? 750 : 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true, isInteraction: false });
    const animation = Animated.parallel([steamAnimation, greeting]);
    animation.start();
    return () => { animation.stop(); steam.setValue(0); gesture.setValue(0); };
  }, [reduced, appActive, mood, steam, gesture]));
  return <View testID="kitchen-companion" pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size * 130 / 120 }}>
    <View style={{ width: 120, height: 130, transform: [{ scale: size / 120 }], transformOrigin: 'top left' }}>
      <Svg width={120} height={130} style={{ position: 'absolute' }}><Ellipse cx={60} cy={119} rx={37} ry={5} fill="#245B4B" opacity={0.10} /></Svg>
      {[32, 54, 76].map((left, index) => <Animated.View key={left} style={{ position: 'absolute', top: 10 + index * 2, left, width: 16, height: 40,
        opacity: reduced ? 0.65 : steam.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0.45, 0.85, 0.6, 0] }),
        transform: [{ translateY: reduced ? 0 : steam.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }],
      }}><Svg width={16} height={40} viewBox="0 0 16 40"><Path d="M8 37C-1 26 17 22 8 5" stroke={index === 1 ? '#245B4B' : '#A9BC96'} strokeWidth={4} fill="none" strokeLinecap="round" /></Svg></Animated.View>)}
      <Animated.View style={{ position: 'absolute', top: 43, left: 0, width: 120, height: 78, transform: [
        { translateY: reduced ? 0 : gesture.interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: [0, mood === 'celebrate' ? -8 : -3, 0, 0] }) },
        { rotate: reduced ? '0deg' : gesture.interpolate({ inputRange: [0, 0.25, 0.55, 0.8, 1], outputRange: ['0deg', '-5deg', '5deg', '-2deg', '0deg'] }) },
      ] }}>
        <Svg width={120} height={78} viewBox="0 0 120 78">
          <Path d="M10 12Q14 67 60 68Q106 67 110 12Z" fill="#245B4B" />
          <Ellipse cx={60} cy={13} rx={50} ry={9} fill="#3D7762" />
          <Path d="M23 26Q26 46 38 51" fill="none" stroke="#78A18A" strokeWidth={4} strokeLinecap="round" />
          {mood === 'celebrate' ? <><Path d="M38 34Q43 28 48 34M72 34Q77 28 82 34" stroke="#FBF7EF" strokeWidth={3.5} fill="none" strokeLinecap="round" /></> : <><Circle cx={43} cy={34} r={3.5} fill="#FBF7EF" /><Circle cx={77} cy={34} r={3.5} fill="#FBF7EF" /></>}
          <Ellipse cx={32} cy={43} rx={6} ry={3} fill="#D6AC8D" opacity={0.7} /><Ellipse cx={88} cy={43} rx={6} ry={3} fill="#D6AC8D" opacity={0.7} />
          <Path d={mood === 'thinking' ? 'M55 46Q60 42 65 46' : 'M49 44Q60 55 71 44'} stroke="#FBF7EF" strokeWidth={3} strokeLinecap="round" fill="none" />
          <Path d="M45 71H75" stroke="#245B4B" strokeWidth={5} strokeLinecap="round" />
        </Svg>
      </Animated.View>
    </View>
  </View>;
}
