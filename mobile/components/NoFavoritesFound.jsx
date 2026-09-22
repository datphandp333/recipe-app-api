import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const COLORS = {
  cream: "#FFF8F0",
  white: "#FFFFFF",
  green: "#245B4B",
  sage: "#DDEDE5",
  coral: "#E76F51",
  text: "#20302A",
  muted: "#66736D",
  border: "#E8DED1",
};

function NoFavoritesFound() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons
          name="heart-outline"
          size={52}
          color={COLORS.coral}
        />
      </View>

      <Text style={styles.title}>
        Your cookbook is waiting
      </Text>

      <Text style={styles.description}>
        Save recipes you love, then personalize
        them with your own ingredients and notes.
      </Text>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.button}
        onPress={() => router.push("/")}
      >
        <Ionicons
          name="restaurant-outline"
          size={20}
          color={COLORS.white}
        />

        <Text style={styles.buttonText}>
          Explore Recipes
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default NoFavoritesFound;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: COLORS.cream,
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 56,
  },

  iconCircle: {
    alignItems: "center",
    backgroundColor: COLORS.sage,
    borderColor: COLORS.border,
    borderRadius: 64,
    borderWidth: 1,
    height: 128,
    justifyContent: "center",
    width: 128,
  },

  title: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "800",
    marginTop: 24,
    textAlign: "center",
  },

  description: {
    color: COLORS.muted,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
    maxWidth: 310,
    textAlign: "center",
  },

  button: {
    alignItems: "center",
    backgroundColor: COLORS.green,
    borderRadius: 16,
    flexDirection: "row",
    gap: 9,
    justifyContent: "center",
    marginTop: 28,
    minHeight: 54,
    paddingHorizontal: 24,
  },

  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
  },
});