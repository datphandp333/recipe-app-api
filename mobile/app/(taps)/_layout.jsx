import SelectionPulse from "../../components/motion/SelectionPulse";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EDITORIAL_COLORS as E } from "../../constants/editorialTheme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

const COLORS = { ...E, border: E.line };

const TAB_ICONS = {
  profile: { active: "person-circle", inactive: "person-circle-outline" },
  pantry: {
    active: "basket",
    inactive: "basket-outline",
  },
  index: {
    active: "restaurant",
    inactive: "restaurant-outline",
  },
  search: {
    active: "search",
    inactive: "search-outline",
  },
  favorites: {
    active: "heart",
    inactive: "heart-outline",
  },
};

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={({ route }) => {
        const icons =
          TAB_ICONS[route.name] || TAB_ICONS.index;

        return {
          headerShown: false,
          tabBarActiveTintColor: COLORS.green,
          tabBarInactiveTintColor: COLORS.muted,
          tabBarStyle: [styles.tabBar, { height: 66 + Math.max(insets.bottom, 10), paddingBottom: Math.max(insets.bottom, 10) }],
          tabBarItemStyle: styles.tabItem,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ focused, color }) => (
            <SelectionPulse selected={focused}>
            <View
              style={[
                styles.iconContainer,
                focused && styles.activeIconContainer,
              ]}
            >
              <Ionicons
                name={
                  focused
                    ? icons.active
                    : icons.inactive
                }
                size={21}
                color={
                  focused
                    ? COLORS.green
                    : color
                }
              />
            </View>
            </SelectionPulse>
          ),
        };
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Recipes",
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
        }}
      />

      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favorites",
        }}
      />
      <Tabs.Screen name="pantry" options={{ title: "Pantry" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: 76,
    paddingTop: 8,
    paddingBottom: 10,

  },

  tabItem: {
    paddingTop: 1,
  },

  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },

  iconContainer: {
    alignItems: "center",
    borderRadius: 18,
    height: 32,
    justifyContent: "center",
    width: 44,
  },

  activeIconContainer: {
    backgroundColor: COLORS.sage,
  },
});
