import { useEffect, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Animated, Easing, StyleSheet, Text, View } from "react-native";
import { SimmerliMark } from "../auth/SimmerliBrand";
import { EDITORIAL_COLORS as E, EDITORIAL_FONT } from "../../constants/editorialTheme";

// Keep navigation mounted underneath so deep links and pending Clerk tasks survive.
export default function LaunchGate({ ready, children, onLayout }) {
  const [visible, setVisible] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(null);
  const [introDone, setIntroDone] = useState(false);
  const [mark] = useState(() => new Animated.Value(0));
  const [copy] = useState(() => new Animated.Value(0));
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReduceMotion(value); })
      .catch(() => { if (active) setReduceMotion(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (reduceMotion === null) return;
    const animation = Animated.parallel([
      Animated.timing(mark, { toValue: 1, duration: reduceMotion ? 0 : 750, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(reduceMotion ? 0 : 220),
        Animated.timing(copy, { toValue: 1, duration: reduceMotion ? 0 : 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.delay(reduceMotion ? 0 : 250),
      ]),
    ]);
    animation.start(({ finished }) => { if (finished) setIntroDone(true); });
    return () => animation.stop();
  }, [reduceMotion, mark, copy]);
  useEffect(() => {
    if (!ready || !introDone) return;
    const animation = Animated.timing(opacity, { toValue: 0, duration: reduceMotion ? 0 : 220, useNativeDriver: true });
    animation.start(({ finished }) => { if (finished) setVisible(false); });
    return () => animation.stop();
  }, [ready, introDone, reduceMotion, opacity]);
  return <View style={styles.page} onLayout={onLayout}>
    <View style={styles.page} pointerEvents={visible ? "none" : "auto"} accessibilityElementsHidden={visible} importantForAccessibility={visible ? "no-hide-descendants" : "auto"}>{children}</View>
    {visible && <Animated.View style={[styles.overlay, { opacity }]} accessibilityViewIsModal>
      <View style={styles.center} accessible accessibilityLabel="Simmerli. A world of flavor, made in your kitchen.">
        <Animated.View style={{ opacity: mark, transform: [{ translateY: mark.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }, { scale: mark.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) }] }}><SimmerliMark size={100} /></Animated.View>
        <Animated.View style={[styles.copy, { opacity: copy, transform: [{ translateY: copy.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
          <Text style={styles.wordmark}>simmerli<Text style={styles.dot}>.</Text></Text>
          <Text style={styles.tagline}>A world of flavor.{"\n"}Made in your kitchen.</Text>
        </Animated.View>
      </View>
      {introDone && !ready && <View style={styles.status} accessibilityLiveRegion="polite"><ActivityIndicator color={E.green} size="small" /><Text style={styles.statusText}>Getting your kitchen ready…</Text></View>}
      <Text style={styles.footer}>GOOD FOOD. A LITTLE CURIOSITY.</Text>
    </Animated.View>}
  </View>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: E.background },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: E.background, alignItems: "center", justifyContent: "center", zIndex: 100 },
  center: { alignItems: "center", paddingHorizontal: 28, paddingBottom: 35 },
  copy: { alignItems: "center", marginTop: 18 },
  wordmark: { fontFamily: EDITORIAL_FONT, fontSize: 52, letterSpacing: -2, color: E.green },
  dot: { color: E.gold },
  tagline: { fontSize: 15, lineHeight: 24, textAlign: "center", color: E.muted, marginTop: 16 },
  status: { position: "absolute", bottom: 110, flexDirection: "row", gap: 10, alignItems: "center" },
  statusText: { color: E.muted, fontSize: 13 },
  footer: { position: "absolute", bottom: 60, color: E.gold, letterSpacing: 2, fontSize: 9, textAlign: "center" },
});
