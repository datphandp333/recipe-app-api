import TouchableOpacity from "./motion/MotionPressable";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { EDITORIAL_COLORS as E, EDITORIAL_FONT } from "../constants/editorialTheme";

// A context/source card is deliberately separate from a complete, saveable recipe.
export default function CountryDishPreview({ country, onDiscuss }) {
  const [error, setError] = useState("");
  const visit = async () => {
    setError("");
    try { await Linking.openURL(country.sourceUrl); }
    catch { setError("Could not open the source. Please try again."); }
  };
  return <View style={styles.card}>
    <View style={styles.top}><Ionicons name="globe-outline" size={22} color={E.gold} /><Text style={styles.kicker}>{country.name} · DISH SPOTLIGHT</Text></View>
    <Text style={styles.title}>{country.dish}</Text>
    <Text style={styles.body}>A starting point for exploring {country.name}’s food. Learn about this dish at the credited source.</Text>
    <Text style={styles.note}>Source preview · a complete Simmerli recipe isn’t available here yet. Shared and regional traditions may have different versions.</Text>
    <TouchableOpacity accessibilityRole="link" accessibilityLabel={`Explore ${country.dish} source`} onPress={visit} style={styles.action}><Text style={styles.link}>Explore the source ↗</Text></TouchableOpacity>
    <TouchableOpacity accessibilityRole="button" onPress={onDiscuss} style={styles.action}><Text style={styles.link}>Discuss a home adaptation with Chef →</Text></TouchableOpacity>
    {!!error && <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  card: { backgroundColor: E.cream, padding: 22, borderRadius: 20, borderColor: E.line, borderWidth: 1, gap: 12, marginBottom: 16 },
  top: { flexDirection: "row", alignItems: "center", gap: 10 },
  kicker: { flex: 1, color: E.gold, fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  title: { fontFamily: EDITORIAL_FONT, color: E.ink, fontSize: 30 },
  body: { color: E.ink, fontSize: 15, lineHeight: 23 },
  note: { color: E.muted, fontSize: 13, lineHeight: 20 },
  action: { minHeight: 44, justifyContent: "center" },
  link: { color: E.green, fontWeight: "600", lineHeight: 21 },
  error: { color: E.coral, lineHeight: 20 },
});
