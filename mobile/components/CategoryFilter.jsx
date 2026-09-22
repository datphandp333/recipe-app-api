import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  ScrollView,
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

export default function CategoryFilter({
  categories = [],
  selectedCategory,
  onSelectCategory,
}) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => {
          const isSelected =
            selectedCategory === category.name;

          return (
            <TouchableOpacity
              key={category.id || category.name}
              activeOpacity={0.85}
              style={[
                styles.categoryButton,
                isSelected && styles.selectedCategoryButton,
              ]}
              onPress={() =>
                onSelectCategory(category.name)
              }
            >
              <View
                style={[
                  styles.imageCircle,
                  isSelected && styles.selectedImageCircle,
                ]}
              >
                {category.image ? (
                  <Image
                    source={{ uri: category.image }}
                    style={styles.image}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <Ionicons
                    name="restaurant-outline"
                    size={20}
                    color={
                      isSelected
                        ? COLORS.white
                        : COLORS.green
                    }
                  />
                )}
              </View>

              <Text
                numberOfLines={1}
                style={[
                  styles.categoryText,
                  isSelected && styles.selectedCategoryText,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 22,
  },

  scrollContent: {
    gap: 10,
    paddingHorizontal: 2,
    paddingVertical: 3,
  },

  categoryButton: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  selectedCategoryButton: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },

  imageCircle: {
    alignItems: "center",
    backgroundColor: COLORS.sage,
    borderRadius: 17,
    height: 34,
    justifyContent: "center",
    overflow: "hidden",
    width: 34,
  },

  selectedImageCircle: {
    backgroundColor: COLORS.coral,
  },

  image: {
    height: "100%",
    width: "100%",
  },

  categoryText: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: "800",
    maxWidth: 115,
  },

  selectedCategoryText: {
    color: COLORS.white,
  },
});