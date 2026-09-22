import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

const COLORS = {
  background: "#FFF8F0",
  green: "#245B4B",
  sage: "#DDEDE5",
  coral: "#E76F51",
  border: "#E8DED1",
};

export default function LoadingSpinner({
  message = "Loading...",
  size = "large",
}) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.spinnerCircle}>
          <ActivityIndicator
            size={size}
            color={COLORS.green}
          />
        </View>

        <Text style={styles.message}>
          {message}
        </Text>

        <View style={styles.accentLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: "center",
    padding: 32,
  },

  content: {
    alignItems: "center",
    maxWidth: 280,
    width: "100%",
  },

  spinnerCircle: {
    alignItems: "center",
    backgroundColor: COLORS.sage,
    borderColor: COLORS.border,
    borderRadius: 44,
    borderWidth: 1,
    height: 88,
    justifyContent: "center",
    width: 88,
  },

  message: {
    color: COLORS.green,
    fontSize: 17,
    fontWeight: "800",
    marginTop: 20,
    textAlign: "center",
  },

  accentLine: {
    backgroundColor: COLORS.coral,
    borderRadius: 999,
    height: 4,
    marginTop: 14,
    width: 48,
  },
});