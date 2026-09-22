import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const COLORS = {
  white: "#FFFFFF",
  green: "#245B4B",
  sage: "#DDEDE5",
  coral: "#E76F51",
  text: "#20302A",
  muted: "#66736D",
  border: "#E8DED1",
};

const getRecipeImage = (recipe) =>
  recipe?.image ||
  recipe?.imageUrl ||
  recipe?.strMealThumb ||
  "";

const getRecipeTitle = (recipe) =>
  recipe?.title ||
  recipe?.strMeal ||
  "Untitled recipe";

const formatCookTime = (cookTime) => {
  if (!cookTime) {
    return null;
  }

  const text = String(cookTime);

  return text.includes("min")
    ? text
    : `${text} min`;
};

export default function RecipeCard({ recipe }) {
  const router = useRouter();

  const imageUrl = getRecipeImage(recipe);
  const title = getRecipeTitle(recipe);
  const cookTime = formatCookTime(
    recipe?.cookTime || recipe?.totalTime
  );
  const servings = recipe?.servings;

  const openRecipe = () => {
    if (!recipe?.id) {
      return;
    }

    router.push(`/recipe/${recipe.id}`);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.card}
      onPress={openRecipe}
    >
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={250}
          />
        ) : (
          <View style={styles.imageFallback}>
            <Ionicons
              name="restaurant-outline"
              size={34}
              color={COLORS.green}
            />
          </View>
        )}

        <View style={styles.recipeBadge}>
          <Ionicons
            name="sparkles"
            size={13}
            color={COLORS.green}
          />

          <Text style={styles.recipeBadgeText}>
            Try this
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text
          numberOfLines={2}
          style={styles.title}
        >
          {title}
        </Text>

        {recipe?.description ? (
          <Text
            numberOfLines={2}
            style={styles.description}
          >
            {recipe.description}
          </Text>
        ) : null}

        <View style={styles.footer}>
          {cookTime ? (
            <View style={styles.detail}>
              <Ionicons
                name="time-outline"
                size={15}
                color={COLORS.coral}
              />

              <Text style={styles.detailText}>
                {cookTime}
              </Text>
            </View>
          ) : null}

          {servings ? (
            <View style={styles.detail}>
              <Ionicons
                name="people-outline"
                size={15}
                color={COLORS.green}
              />

              <Text style={styles.detailText}>
                {servings}{" "}
                {String(servings) === "1"
                  ? "serving"
                  : "servings"}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 18,
    overflow: "hidden",
  },

  imageContainer: {
    backgroundColor: COLORS.sage,
    height: 172,
    position: "relative",
    width: "100%",
  },

  image: {
    height: "100%",
    width: "100%",
  },

  imageFallback: {
    alignItems: "center",
    backgroundColor: COLORS.sage,
    flex: 1,
    justifyContent: "center",
  },

  recipeBadge: {
    alignItems: "center",
    backgroundColor: "#FFF0C9",
    borderRadius: 999,
    flexDirection: "row",
    gap: 5,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: "absolute",
    top: 12,
  },

  recipeBadgeText: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "800",
  },

  content: {
    padding: 16,
  },

  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
  },

  description: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 7,
  },

  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 14,
  },

  detail: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },

  detailText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "700",
  },
});