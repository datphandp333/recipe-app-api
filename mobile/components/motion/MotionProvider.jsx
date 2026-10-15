import { createContext, useContext, useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// Default to static until the system preference is known; one listener for the app.
const MotionContext = createContext(true);
export const useReducedMotion = () => useContext(MotionContext);
export default function MotionProvider({ children }) {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let active = true;
    let changed = false;
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', value => {
      changed = true;
      if (active) setReduced(value);
    });
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (active && !changed) setReduced(value);
    }).catch(() => {});
    return () => { active = false; listener.remove(); };
  }, []);
  return <MotionContext.Provider value={reduced}>{children}</MotionContext.Provider>;
}
