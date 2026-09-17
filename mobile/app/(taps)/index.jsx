import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { homeStyles } from "../../assets/styles/home.styles";
import CategoryFilter from "../../components/CategoryFilter";
import LoadingSpinner from "../../components/LoadingSpinner";
import RecipeCard from "../../components/RecipeCard";
import { COLORS } from "../../constants/colors";
import { MealAPI } from "../../services/mealAPI";

const HomeScreen = () => {
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] =
    useState(null);

  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);

  const [featuredRecipe, setFeaturedRecipe] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        apiCategories,
        randomMeals,
        featuredMeal,
      ] = await Promise.all([
        MealAPI.getCategories(),
        MealAPI.getRandomMeals(12),
        MealAPI.getRandomMeal(),
      ]);

      const transformedCategories =
        apiCategories.map((category, index) => ({
          id: index + 1,
          name: category.strCategory,
          image: category.strCategoryThumb,
          description:
            category.strCategoryDescription,
        }));

      setCategories(transformedCategories);

      if (
        !selectedCategory &&
        transformedCategories.length > 0
      ) {
        setSelectedCategory(
          transformedCategories[0].name
        );
      }

      const transformedMeals = randomMeals
        .map((meal) =>
          MealAPI.transformMealData(meal)
        )
        .filter(Boolean);

      setRecipes(transformedMeals);

      const transformedFeatured =
        MealAPI.transformMealData(featuredMeal);

      setFeaturedRecipe(transformedFeatured);
    } catch (error) {
      console.error(
        "Error loading home data:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryData = async (category) => {
    try {
      const meals =
        await MealAPI.filterByCategory(category);

      const transformedMeals = meals
        .map((meal) =>
          MealAPI.transformMealData(meal)
        )
        .filter(Boolean);

      setRecipes(transformedMeals);
    } catch (error) {
      console.error(
        "Error loading category data:",
        error
      );

      setRecipes([]);
    }
  };

  const handleCategorySelect = async (
    category
  ) => {
    setSelectedCategory(category);
    await loadCategoryData(category);
  };

  const onRefresh = async () => {
    setRefreshing(true);

    await loadData();

    setRefreshing(false);
  };

  const openAiRecipeGenerator = () => {
    router.push("/ai-recipe");
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !refreshing) {
    return (
      <LoadingSpinner message="Loading delicious recipes..." />
    );
  }

  return (
    <View style={homeStyles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={
          homeStyles.scrollContent
        }
      >
        <View style={homeStyles.welcomeSection}>
          <Image
            source={require("../../assets/images/lamb.png")}
            style={styles.animalImage}
            contentFit="contain"
          />

          <Image
            source={require("../../assets/images/chicken.png")}
            style={styles.animalImage}
            contentFit="contain"
          />

          <Image
            source={require("../../assets/images/pork.png")}
            style={styles.animalImage}
            contentFit="contain"
          />
        </View>

        {/* AI RECIPE GENERATOR */}
        <View style={styles.aiSection}>
          <TouchableOpacity
            style={styles.aiCard}
            activeOpacity={0.9}
            onPress={openAiRecipeGenerator}
          >
            <View style={styles.aiDecorativeCircleOne} />

            <View style={styles.aiDecorativeCircleTwo} />

            <View style={styles.aiContent}>
              <View style={styles.aiIconContainer}>
                <Ionicons
                  name="sparkles"
                  size={28}
                  color={COLORS.white}
                />
              </View>

              <View style={styles.aiTextContainer}>
                <View style={styles.aiBadge}>
                  <Ionicons
                    name="logo-google"
                    size={12}
                    color={COLORS.primary}
                  />

                  <Text style={styles.aiBadgeText}>
                    POWERED BY GEMINI
                  </Text>
                </View>

                <Text style={styles.aiTitle}>
                  Create a recipe with AI
                </Text>

                <Text style={styles.aiDescription}>
                  Enter the ingredients you have and get
                  a personalized recipe in seconds.
                </Text>
              </View>

              <View style={styles.aiArrow}>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={COLORS.primary}
                />
              </View>
            </View>

            <View style={styles.aiExamples}>
              <View style={styles.aiExample}>
                <Ionicons
                  name="basket-outline"
                  size={14}
                  color={COLORS.white}
                />

                <Text style={styles.aiExampleText}>
                  Your ingredients
                </Text>
              </View>

              <View style={styles.aiExample}>
                <Ionicons
                  name="restaurant-outline"
                  size={14}
                  color={COLORS.white}
                />

                <Text style={styles.aiExampleText}>
                  Complete recipe
                </Text>
              </View>

              <View style={styles.aiExample}>
                <Ionicons
                  name="images-outline"
                  size={14}
                  color={COLORS.white}
                />

                <Text style={styles.aiExampleText}>
                  Ingredient pictures
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* FEATURED RECIPE */}
        {featuredRecipe && (
          <View style={homeStyles.featuredSection}>
            <TouchableOpacity
              style={homeStyles.featuredCard}
              activeOpacity={0.9}
              onPress={() =>
                router.push(
                  `/recipe/${featuredRecipe.id}`
                )
              }
            >
              <View
                style={
                  homeStyles.featuredImageContainer
                }
              >
                <Image
                  source={{
                    uri: featuredRecipe.image,
                  }}
                  style={homeStyles.featuredImage}
                  contentFit="cover"
                  transition={500}
                />

                <View
                  style={homeStyles.featuredOverlay}
                >
                  <View
                    style={homeStyles.featuredBadge}
                  >
                    <Text
                      style={
                        homeStyles.featuredBadgeText
                      }
                    >
                      Featured
                    </Text>
                  </View>

                  <View
                    style={homeStyles.featuredContent}
                  >
                    <Text
                      style={homeStyles.featuredTitle}
                      numberOfLines={2}
                    >
                      {featuredRecipe.title}
                    </Text>

                    <View
                      style={homeStyles.featuredMeta}
                    >
                      <View style={homeStyles.metaItem}>
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color={COLORS.white}
                        />

                        <Text
                          style={homeStyles.metaText}
                        >
                          {featuredRecipe.cookTime}
                        </Text>
                      </View>

                      <View style={homeStyles.metaItem}>
                        <Ionicons
                          name="people-outline"
                          size={16}
                          color={COLORS.white}
                        />

                        <Text
                          style={homeStyles.metaText}
                        >
                          {featuredRecipe.servings}
                        </Text>
                      </View>

                      {!!featuredRecipe.area && (
                        <View
                          style={homeStyles.metaItem}
                        >
                          <Ionicons
                            name="location-outline"
                            size={16}
                            color={COLORS.white}
                          />

                          <Text
                            style={
                              homeStyles.metaText
                            }
                          >
                            {featuredRecipe.area}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* CATEGORIES */}
        {categories.length > 0 && (
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={
              handleCategorySelect
            }
          />
        )}

        {/* RECIPES */}
        <View style={homeStyles.recipesSection}>
          <View style={homeStyles.sectionHeader}>
            <Text style={homeStyles.sectionTitle}>
              {selectedCategory || "Recipes"}
            </Text>
          </View>

          {recipes.length > 0 ? (
            <FlatList
              data={recipes}
              renderItem={({ item }) => (
                <RecipeCard recipe={item} />
              )}
              keyExtractor={(item) =>
                item.id.toString()
              }
              numColumns={2}
              columnWrapperStyle={homeStyles.row}
              contentContainerStyle={
                homeStyles.recipesGrid
              }
              scrollEnabled={false}
            />
          ) : (
            <View style={homeStyles.emptyState}>
              <Ionicons
                name="restaurant-outline"
                size={64}
                color={COLORS.textLight}
              />

              <Text style={homeStyles.emptyTitle}>
                No recipes found
              </Text>

              <Text
                style={homeStyles.emptyDescription}
              >
                Try a different category
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  animalImage: {
    width: 100,
    height: 100,
  },

  aiSection: {
    paddingHorizontal: 16,
    marginBottom: 22,
  },

  aiCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    overflow: "hidden",
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },

  aiDecorativeCircleOne: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    right: -75,
    top: -95,
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  aiDecorativeCircleTwo: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    left: -45,
    bottom: -60,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  aiContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  aiIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  aiTextContainer: {
    flex: 1,
    marginLeft: 13,
    marginRight: 10,
  },

  aiBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    marginBottom: 7,
  },

  aiBadgeText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  aiTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
  },

  aiDescription: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  aiArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },

  aiExamples: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 15,
  },

  aiExample: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.14)",
  },

  aiExampleText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "600",
  },
});

export default HomeScreen;