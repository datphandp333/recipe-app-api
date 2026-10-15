import { LayoutAnimation, Platform, UIManager } from 'react-native';
import { useReducedMotion } from './MotionProvider';

export default function useLayoutTransition() {
  const reduced = useReducedMotion();
  return () => {
    // Native layout changes connect the two arrangements; web keeps its normal layout.
    if (reduced || Platform.OS === 'web') return;
    if (Platform.OS === 'android') UIManager.setLayoutAnimationEnabledExperimental?.(true);
    LayoutAnimation.configureNext({ duration: 220, update: { type: 'easeInEaseOut' }, create: { type: 'easeOut', property: 'opacity' }, delete: { type: 'easeIn', property: 'opacity' } });
  };
}
