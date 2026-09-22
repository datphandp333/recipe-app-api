import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

const COLORS = {
  cream: "#FFF8F0",
  white: "#FFFFFF",
  green: "#245B4B",
  sage: "#DDEDE5",
  coral: "#E76F51",
  muted: "#74807B",
  border: "#E8DED1",
};

const TAB_ICONS = {
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
  return (
    <Tabs
      screenOptions={({ route }) => {
        const icons =
          TAB_ICONS[route.name] || TAB_ICONS.index;

        return {
          headerShown: false,
          tabBarActiveTintColor: COLORS.green,
          tabBarInactiveTintColor: COLORS.muted,
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabItem,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ focused, color }) => (
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
    boxShadow: "0 -3px 12px rgba(36, 91, 75, 0.08)",
  },

  tabItem: {
    paddingTop: 1,
  },

  tabLabel: {
    fontSize: 12,
    fontWeight: "800",
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