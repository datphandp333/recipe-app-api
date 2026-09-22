import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "../constants/colors";

const SafeScreen = ({
  children,
  style,
  backgroundColor = COLORS.background,
  statusBarStyle = "dark",
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          paddingTop: insets.top,
        },
        style,
      ]}
    >
      <StatusBar
        style={statusBarStyle}
        backgroundColor={backgroundColor}
      />

      {children}
    </View>
  );
};

export default SafeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});