import { useState } from 'react';
import KitchenCompanion from '../../components/chef/KitchenCompanion';
import TouchableOpacity from "../../components/motion/MotionPressable";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SimmerliMark } from "../../components/auth/SimmerliBrand";
import { EDITORIAL_COLORS as E, EDITORIAL_FONT } from "../../constants/editorialTheme";

export default function Welcome() {
  const router = useRouter();
  const [greeting, setGreeting] = useState(0);
  return <SafeAreaView style={s.page}>
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.brand} accessible accessibilityLabel="Simmerli"><SimmerliMark size={27} /><Text style={s.wordmark}>simmerli<Text style={{ color: E.gold }}>.</Text></Text></View>
      <View style={s.hero}>
        <Image source={require("../../assets/images/curated/curated-vegetable-paella.jpg")} contentFit="cover" style={StyleSheet.absoluteFillObject} accessibilityLabel="Vegetable paella serving suggestion" />
        <LinearGradient colors={["transparent", "rgba(23,62,51,0.12)", "rgba(23,62,51,0.94)"]} locations={[0, 0.35, 1]} style={StyleSheet.absoluteFillObject} />
        <View style={s.heroBadge}><Ionicons name="restaurant-outline" size={14} color={E.ink} /><Text style={s.heroBadgeText}>A LITTLE INSPIRATION, EVERY DAY</Text></View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Say hello to Chef" onPress={() => setGreeting(value => value + 1)} style={s.companion}><KitchenCompanion key={greeting} size={50} /></TouchableOpacity>
        <View style={s.heroCopy}><Text style={s.heroTitle}>Good things{"\n"}start at your table.</Text><Text style={s.heroCaption}>Big flavors. Everyday ingredients. Your kitchen.</Text></View>
      </View>
      <View style={s.intro}>
        <Text style={s.eyebrow}>WELCOME TO YOUR PERSONAL KITCHEN</Text>
        <Text style={s.title}>A world of flavor.{"\n"}Made for you.</Text>
        <Text style={s.body}>Discover dishes, cook with what you have, and find your next favorite with Chef.</Text>
      </View>
      <View style={s.features}>
        {[["globe-outline", "Explore dishes"], ["basket-outline", "Use your pantry"], ["sparkles-outline", "Cook with Chef"]].map(([icon, label]) => <View key={label} style={s.feature}><Ionicons name={icon} size={20} color={E.green} /><Text style={s.featureText}>{label}</Text></View>)}
      </View>
      <TouchableOpacity accessibilityRole="button" onPress={() => router.push("/(auth)/onboarding")} style={s.button}><Text style={s.buttonText}>Find my first dish</Text><Ionicons name="arrow-forward" size={19} color={E.white} /></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={() => router.push("/(auth)/sign-in")} style={s.signIn}><Text style={s.signInText}>Already have an account? <Text style={s.signInLink}>Sign in</Text></Text></TouchableOpacity>
      <Text style={s.footer}>Your recipes, pantry, and favorites—all together.</Text>
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: E.background },
  content: { flexGrow: 1, width: "100%", maxWidth: 560, alignSelf: "center", paddingHorizontal: 22, paddingTop: 12, paddingBottom: 24, gap: 20 },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  wordmark: { color: E.green, fontFamily: EDITORIAL_FONT, fontSize: 29, letterSpacing: -1 },
  hero: { height: 260, borderRadius: 24, overflow: "hidden", backgroundColor: E.green, justifyContent: "space-between" },
  heroBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: E.background, padding: 11, borderRadius: 20, margin: 16 },
  heroBadgeText: { fontSize: 8, letterSpacing: 0.6, fontWeight: "700", color: E.ink },
  companion: { position: "absolute", right: 10, top: 10, width: 66, height: 68, borderRadius: 24, backgroundColor: E.background, justifyContent: "center", alignItems: "center" },
  heroCopy: { padding: 22, gap: 10 },
  heroTitle: { fontFamily: EDITORIAL_FONT, fontSize: 32, lineHeight: 37, color: E.white },
  heroCaption: { color: "#F0EFE7", fontSize: 12, lineHeight: 18 },
  intro: { gap: 12 },
  eyebrow: { color: E.gold, fontSize: 9, letterSpacing: 1.2, fontWeight: "700" },
  title: { fontFamily: EDITORIAL_FONT, color: E.ink, fontSize: 34, lineHeight: 40, letterSpacing: -0.8 },
  body: { color: E.muted, fontSize: 15, lineHeight: 23 },
  features: { flexDirection: "row", justifyContent: "space-between", gap: 8, paddingVertical: 6 },
  feature: { flex: 1, alignItems: "center", gap: 8 },
  featureText: { color: E.green, fontSize: 11, fontWeight: "600", textAlign: "center" },
  button: { backgroundColor: E.green, minHeight: 56, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 18, gap: 12 },
  buttonText: { color: E.white, fontSize: 16, fontWeight: "600", flexShrink: 1 },
  signIn: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  signInText: { color: E.muted, fontSize: 14, textAlign: "center", lineHeight: 22 },
  signInLink: { color: E.green, fontWeight: "700" },
  footer: { color: E.muted, textAlign: "center", fontSize: 11, lineHeight: 17 },
});
