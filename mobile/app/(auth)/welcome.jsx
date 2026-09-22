import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { COLORS } from "../../constants/colors";

const benefits = [
  {
    icon: "sparkles-outline",
    title: "AI meal ideas",
    text: "Turn your ingredients into a recipe.",
  },
  {
    icon: "leaf-outline",
    title: "Ingredient photos",
    text: "Know what every ingredient looks like.",
  },
  {
    icon: "heart-outline",
    title: "Your cookbook",
    text: "Save and personalize favorite dishes.",
  },
];

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topSection}>
          <View style={styles.badge}>
            <Ionicons
              name="restaurant-outline"
              size={16}
              color={COLORS.primary}
            />
            <Text style={styles.badgeText}>Your kitchen companion</Text>
          </View>

          <Image
            source={require("../../assets/images/i1.png")}
            style={styles.chefImage}
            contentFit="contain"
            transition={250}
          />

          <Text style={styles.title}>Make every meal feel easy.</Text>

          <Text style={styles.subtitle}>
            Discover recipes, recognize ingredients before you shop, and make
            each saved dish your own.
          </Text>
        </View>

        <View style={styles.benefitsSection}>
          {benefits.map((benefit) => (
            <View key={benefit.title} style={styles.benefitCard}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name={benefit.icon}
                  size={22}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>{benefit.text}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => router.push("/(auth)/sign-up")}
          >
            <Text style={styles.primaryButtonText}>Start cooking</Text>
            <Ionicons
              name="arrow-forward"
              size={22}
              color={COLORS.white}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.8}
            onPress={() => router.push("/(auth)/sign-in")}
          >
            <Text style={styles.secondaryText}>I already have an account</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          Simple recipes. Helpful visuals. Made for your taste.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 28,
  },

  topSection: {
    alignItems: "center",
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },

  badgeText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },

  chefImage: {
    width: "100%",
    height: 250,
    marginTop: 4,
    marginBottom: 2,
  },

  title: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.7,
    textAlign: "center",
    lineHeight: 40,
  },

  subtitle: {
    color: COLORS.textLight,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginTop: 12,
    maxWidth: 350,
  },

  benefitsSection: {
    gap: 10,
    marginTop: 28,
  },

  benefitCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 14,
  },

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    marginRight: 13,
  },

  benefitTextContainer: {
    flex: 1,
  },

  benefitTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
    textTransform: "capitalize",
  },

  benefitDescription: {
    color: COLORS.textLight,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },

  actionSection: {
    gap: 12,
    marginTop: 28,
  },

  primaryButton: {
    minHeight: 58,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
  },

  primaryButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "800",
  },

  secondaryButton: {
    minHeight: 50,
    justifyContent: "center",
    alignItems: "center",
  },

  secondaryText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "800",
  },

  footerText: {
    color: COLORS.textLight,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 14,
  },
});