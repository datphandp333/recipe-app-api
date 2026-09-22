import {
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useClerk, useUser } from "@clerk/expo";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { MealAPI } from "../../services/mealAPI";
import LoadingSpinner from "../../components/LoadingSpinner";

const THEME = {
  background: "#FFF8F0",
  surface: "#FFFFFF",
  primary: "#245B4B",
  primaryDark: "#173E33",
  coral: "#E76F51",
  coralDark: "#C9563B",
  saffron: "#F4C95D",
  sage: "#DCECE4",
  cream: "#FFF2D8",
  border: "#E9E1D7",
  ink: "#20302A",
  muted: "#77817C",
  softText: "#9AA29F",
  white: "#FFFFFF",
  danger: "#D64B43",
};

const CATEGORY_ICONS = {
  Beef: "flame-outline",
  Chicken: "restaurant-outline",
  Dessert: "ice-cream-outline",
  Lamb: "restaurant-outline",
  Miscellaneous: "grid-outline",
  Pasta: "nutrition-outline",
  Pork: "pizza-outline",
  Seafood: "fish-outline",
  Side: "leaf-outline",
  Starter: "cafe-outline",
  Vegan: "leaf-outline",
  Vegetarian: "leaf-outline",
  Breakfast: "sunny-outline",
  Goat: "restaurant-outline",
};

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
};

const getInitials = (name) => {
  return String(name || "Chef")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const FeaturedImage = ({ recipe }) => {
  const [showImage, setShowImage] =
    useState(Boolean(recipe?.image));

  if (!showImage) {
    return (
      <View style={styles.featuredImageFallback}>
        <Ionicons
          name="restaurant"
          size={44}
          color={THEME.white}
        />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: recipe.image }}
      style={styles.featuredImage}
      contentFit="cover"
      transition={250}
      onError={() => setShowImage(false)}
    />
  );
};

const RecipeTile = ({ recipe, onPress }) => {
  const [showImage, setShowImage] =
    useState(Boolean(recipe?.image));

  return (
    <TouchableOpacity
      style={styles.recipeTile}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.recipeImageContainer}>
        {showImage ? (
          <Image
            source={{ uri: recipe.image }}
            style={styles.recipeImage}
            contentFit="cover"
            transition={180}
            onError={() => setShowImage(false)}
          />
        ) : (
          <View style={styles.recipeImageFallback}>
            <Ionicons
              name="restaurant-outline"
              size={28}
              color={THEME.primary}
            />
          </View>
        )}

        <View style={styles.recipeHeart}>
          <Ionicons
            name="heart-outline"
            size={16}
            color={THEME.primary}
          />
        </View>
      </View>

      <View style={styles.recipeTileContent}>
        <Text
          style={styles.recipeTileTitle}
          numberOfLines={2}
        >
          {recipe.title}
        </Text>

        <View style={styles.recipeTileMeta}>
          <Ionicons
            name="time-outline"
            size={14}
            color={THEME.coral}
          />

          <Text style={styles.recipeTileMetaText}>
            {recipe.cookTime || "Quick meal"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const HomeScreen = () => {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();

  const [selectedCategory, setSelectedCategory] =
    useState("All");
  const [allRecipes, setAllRecipes] =
    useState([]);
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredRecipe, setFeaturedRecipe] =
    useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const displayName = useMemo(() => {
    return (
      user?.firstName ||
      user?.username ||
      user?.primaryEmailAddress?.emailAddress
        ?.split("@")[0] ||
      "Chef"
    );
  }, [user]);

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
        Array.isArray(apiCategories)
          ? apiCategories
              .map((category, index) => ({
                id: String(index + 1),
                name: category.strCategory,
                image: category.strCategoryThumb,
                description:
                  category.strCategoryDescription,
              }))
              .filter((category) => category.name)
          : [];

      const transformedMeals =
        Array.isArray(randomMeals)
          ? randomMeals
              .map((meal) =>
                MealAPI.transformMealData(meal)
              )
              .filter(Boolean)
          : [];

      setCategories(transformedCategories);
      setAllRecipes(transformedMeals);

      if (selectedCategory === "All") {
        setRecipes(transformedMeals);
      }

      setFeaturedRecipe(
        featuredMeal
          ? MealAPI.transformMealData(featuredMeal)
          : null
      );
    } catch (error) {
      console.error(
        "Error loading home recipes:",
        error
      );

      setRecipes([]);
      setAllRecipes([]);

      if (Platform.OS !== "web") {
        Alert.alert(
          "Could not load recipes",
          "Pull down to try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryData = async (category) => {
    try {
      if (category === "All") {
        setRecipes(allRecipes);
        return;
      }

      const meals =
        await MealAPI.filterByCategory(category);

      const transformedMeals =
        Array.isArray(meals)
          ? meals
              .map((meal) =>
                MealAPI.transformMealData(meal)
              )
              .filter(Boolean)
          : [];

      setRecipes(transformedMeals);
    } catch (error) {
      console.error(
        "Error loading category recipes:",
        error
      );

      setRecipes([]);
    }
  };

  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    await loadCategoryData(category);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    const signOutUser = async () => {
      try {
        await signOut();
        router.replace("/(auth)/sign-in");
      } catch (error) {
        console.error("Sign out error:", error);

        if (Platform.OS !== "web") {
          Alert.alert(
            "Could not sign out",
            "Please try again."
          );
        }
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Do you want to sign out of Recipe App?"
      );

      if (confirmed) {
        await signOutUser();
      }

      return;
    }

    Alert.alert(
      "Sign out?",
      "You can sign back in anytime to access your cookbook.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign out",
          style: "destructive",
          onPress: signOutUser,
        },
      ]
    );
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !refreshing) {
    return (
      <LoadingSpinner message="Setting your table..." />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={THEME.primary}
              colors={[THEME.primary]}
            />
          }
        >
          <View style={styles.header}>
            <View style={styles.greetingGroup}>
              <Text style={styles.greeting}>
                {getGreeting()}
              </Text>

              <Text
                style={styles.userName}
                numberOfLines={1}
              >
                {displayName}
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.avatarButton}
                onPress={() =>
                  router.push("/favorites")
                }
                activeOpacity={0.8}
                accessibilityLabel="Open favorites"
              >
                <Text style={styles.avatarText}>
                  {getInitials(displayName)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleSignOut}
                activeOpacity={0.8}
                accessibilityLabel="Sign out"
              >
                <Ionicons
                  name="log-out-outline"
                  size={21}
                  color={THEME.primary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroDecorOne} />
            <View style={styles.heroDecorTwo} />

            <View style={styles.heroIconCircle}>
              <Ionicons
                name="restaurant"
                size={28}
                color={THEME.primary}
              />
            </View>

            <Text style={styles.heroEyebrow}>
              MAKE SOMETHING GOOD
            </Text>

            <Text style={styles.heroTitle}>
              What are we cooking today?
            </Text>

            <Text style={styles.heroDescription}>
              Explore easy ideas, use your pantry,
              or let Recipe Chef help you decide.
            </Text>

            <TouchableOpacity
              style={styles.heroButton}
              onPress={() => router.push("/search")}
              activeOpacity={0.9}
            >
              <Ionicons
                name="search-outline"
                size={19}
                color={THEME.white}
              />

              <Text style={styles.heroButtonText}>
                Find a recipe
              </Text>

              <Ionicons
                name="arrow-forward"
                size={18}
                color={THEME.white}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.quickActionRow}>
            <TouchableOpacity
              style={[
                styles.quickActionCard,
                styles.quickActionChef,
              ]}
              onPress={() =>
                router.push("/ai-recipe")
              }
              activeOpacity={0.9}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons
                  name="sparkles"
                  size={22}
                  color={THEME.white}
                />
              </View>

              <View style={styles.quickActionTextGroup}>
                <Text style={styles.quickActionTitle}>
                  Recipe Chef
                </Text>

                <Text style={styles.quickActionSubtitle}>
                  Cook from your pantry
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={19}
                color={THEME.white}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionCard,
                styles.quickActionCookbook,
              ]}
              onPress={() =>
                router.push("/favorites")
              }
              activeOpacity={0.9}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  styles.cookbookIcon,
                ]}
              >
                <Ionicons
                  name="heart"
                  size={20}
                  color={THEME.coral}
                />
              </View>

              <View style={styles.quickActionTextGroup}>
                <Text
                  style={[
                    styles.quickActionTitle,
                    styles.cookbookTitle,
                  ]}
                >
                  My Cookbook
                </Text>

                <Text
                  style={[
                    styles.quickActionSubtitle,
                    styles.cookbookSubtitle,
                  ]}
                >
                  Saved your way
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {featuredRecipe && (
            <View style={styles.featuredSection}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionEyebrow}>
                    COOK THIS NEXT
                  </Text>

                  <Text style={styles.sectionTitle}>
                    Today&apos;s tasty pick
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.smallRefreshButton}
                  onPress={handleRefresh}
                  activeOpacity={0.8}
                  accessibilityLabel="Refresh recipes"
                >
                  <Ionicons
                    name="refresh-outline"
                    size={19}
                    color={THEME.primary}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.featuredCard}
                onPress={() =>
                  router.push(
                    `/recipe/${featuredRecipe.id}`
                  )
                }
                activeOpacity={0.92}
              >
                <FeaturedImage recipe={featuredRecipe} />

                <View style={styles.featuredGradient} />

                <View style={styles.featuredContent}>
                  <View style={styles.featuredBadge}>
                    <Ionicons
                      name="star"
                      size={13}
                      color={THEME.primaryDark}
                    />

                    <Text style={styles.featuredBadgeText}>
                      Featured today
                    </Text>
                  </View>

                  <Text
                    style={styles.featuredTitle}
                    numberOfLines={2}
                  >
                    {featuredRecipe.title}
                  </Text>

                  <View style={styles.featuredMeta}>
                    <View style={styles.featuredMetaItem}>
                      <Ionicons
                        name="time-outline"
                        size={15}
                        color={THEME.white}
                      />

                      <Text style={styles.featuredMetaText}>
                        {featuredRecipe.cookTime ||
                          "Easy meal"}
                      </Text>
                    </View>

                    {featuredRecipe.area && (
                      <View style={styles.featuredMetaItem}>
                        <Ionicons
                          name="location-outline"
                          size={15}
                          color={THEME.white}
                        />

                        <Text
                          style={styles.featuredMetaText}
                          numberOfLines={1}
                        >
                          {featuredRecipe.area}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.browseSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>
                  EXPLORE YOUR MOOD
                </Text>

                <Text style={styles.sectionTitle}>
                  Pick a craving
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => router.push("/search")}
                activeOpacity={0.8}
              >
                <Text style={styles.seeAllText}>
                  Search all
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={
                styles.categoryScrollContent
              }
            >
              <TouchableOpacity
                style={[
                  styles.categoryPill,
                  selectedCategory === "All" &&
                    styles.categoryPillSelected,
                ]}
                onPress={() =>
                  handleCategorySelect("All")
                }
                activeOpacity={0.85}
              >
                <Ionicons
                  name="apps-outline"
                  size={17}
                  color={
                    selectedCategory === "All"
                      ? THEME.white
                      : THEME.primary
                  }
                />

                <Text
                  style={[
                    styles.categoryPillText,
                    selectedCategory === "All" &&
                      styles.categoryPillTextSelected,
                  ]}
                >
                  For you
                </Text>
              </TouchableOpacity>

              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryPill,
                    selectedCategory ===
                      category.name &&
                      styles.categoryPillSelected,
                  ]}
                  onPress={() =>
                    handleCategorySelect(
                      category.name
                    )
                  }
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={
                      CATEGORY_ICONS[
                        category.name
                      ] || "restaurant-outline"
                    }
                    size={17}
                    color={
                      selectedCategory ===
                      category.name
                        ? THEME.white
                        : THEME.primary
                    }
                  />

                  <Text
                    style={[
                      styles.categoryPillText,
                      selectedCategory ===
                        category.name &&
                        styles.categoryPillTextSelected,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.recipeSection}>
            <View style={styles.recipeGridHeader}>
              <View>
                <Text style={styles.recipeGridTitle}>
                  {selectedCategory === "All"
                    ? "Made for you"
                    : selectedCategory}
                </Text>

                <Text style={styles.recipeGridSubtitle}>
                  {recipes.length} ideas to try today
                </Text>
              </View>

              <TouchableOpacity
                style={styles.gridButton}
                onPress={() => router.push("/search")}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="grid-outline"
                  size={19}
                  color={THEME.primary}
                />
              </TouchableOpacity>
            </View>

            {recipes.length > 0 ? (
              <FlatList
                data={recipes}
                renderItem={({ item }) => (
                  <RecipeTile
                    recipe={item}
                    onPress={() =>
                      router.push(
                        `/recipe/${item.id}`
                      )
                    }
                  />
                )}
                keyExtractor={(item) =>
                  String(item.id)
                }
                numColumns={2}
                columnWrapperStyle={styles.recipeRow}
                contentContainerStyle={
                  styles.recipeGrid
                }
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="restaurant-outline"
                    size={32}
                    color={THEME.primary}
                  />
                </View>

                <Text style={styles.emptyTitle}>
                  Nothing here yet
                </Text>

                <Text style={styles.emptyDescription}>
                  Try another craving or search for
                  your favorite dish.
                </Text>

                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() =>
                    router.push("/search")
                  }
                  activeOpacity={0.85}
                >
                  <Text style={styles.emptyButtonText}>
                    Search recipes
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.background,
  },

  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  greetingGroup: {
    flex: 1,
    paddingRight: 12,
  },

  greeting: {
    color: THEME.muted,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },

  userName: {
    color: THEME.ink,
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.7,
  },

  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
  },

  avatarButton: {
    alignItems: "center",
    backgroundColor: THEME.primary,
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },

  avatarText: {
    color: THEME.white,
    fontSize: 14,
    fontWeight: "800",
  },

  logoutButton: {
    alignItems: "center",
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },

  heroCard: {
    backgroundColor: THEME.cream,
    borderColor: "#F0DCA9",
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
    padding: 24,
  },

  heroDecorOne: {
    backgroundColor: THEME.saffron,
    borderRadius: 60,
    height: 120,
    opacity: 0.32,
    position: "absolute",
    right: -34,
    top: -48,
    width: 120,
  },

  heroDecorTwo: {
    backgroundColor: THEME.coral,
    borderRadius: 36,
    bottom: -24,
    height: 72,
    opacity: 0.16,
    position: "absolute",
    right: 52,
    width: 72,
  },

  heroIconCircle: {
    alignItems: "center",
    backgroundColor: THEME.white,
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    marginBottom: 17,
    width: 44,
  },

  heroEyebrow: {
    color: THEME.coralDark,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginBottom: 7,
  },

  heroTitle: {
    color: THEME.primaryDark,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.9,
    lineHeight: 36,
    maxWidth: "88%",
  },

  heroDescription: {
    color: "#5E625B",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    maxWidth: "92%",
  },

  heroButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: THEME.primary,
    borderRadius: 15,
    flexDirection: "row",
    gap: 9,
    marginTop: 21,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },

  heroButtonText: {
    color: THEME.white,
    fontSize: 15,
    fontWeight: "800",
  },

  quickActionRow: {
    gap: 12,
    marginBottom: 29,
  },

  quickActionCard: {
    alignItems: "center",
    borderRadius: 20,
    flexDirection: "row",
    minHeight: 76,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },

  quickActionChef: {
    backgroundColor: THEME.primary,
  },

  quickActionCookbook: {
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
    borderWidth: 1,
  },

  quickActionIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.17)",
    borderRadius: 16,
    height: 48,
    justifyContent: "center",
    marginRight: 13,
    width: 48,
  },

  cookbookIcon: {
    backgroundColor: "#FDE5DD",
  },

  quickActionTextGroup: {
    flex: 1,
  },

  quickActionTitle: {
    color: THEME.white,
    fontSize: 16,
    fontWeight: "800",
  },

  cookbookTitle: {
    color: THEME.ink,
  },

  quickActionSubtitle: {
    color: "#D6E8E0",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 3,
  },

  cookbookSubtitle: {
    color: THEME.muted,
  },

  featuredSection: {
    marginBottom: 30,
  },

  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  sectionEyebrow: {
    color: THEME.coral,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 4,
  },

  sectionTitle: {
    color: THEME.ink,
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.45,
  },

  smallRefreshButton: {
    alignItems: "center",
    backgroundColor: THEME.sage,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },

  featuredCard: {
    backgroundColor: THEME.primaryDark,
    borderRadius: 25,
    height: 265,
    overflow: "hidden",
  },

  featuredImage: {
    height: "100%",
    width: "100%",
  },

  featuredImageFallback: {
    alignItems: "center",
    backgroundColor: THEME.primary,
    height: "100%",
    justifyContent: "center",
    width: "100%",
  },

  featuredGradient: {
    backgroundColor: "rgba(16, 40, 32, 0.52)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },

  featuredContent: {
    bottom: 0,
    left: 0,
    padding: 20,
    position: "absolute",
    right: 0,
  },

  featuredBadge: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: THEME.saffron,
    borderRadius: 20,
    flexDirection: "row",
    gap: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  featuredBadgeText: {
    color: THEME.primaryDark,
    fontSize: 11,
    fontWeight: "800",
  },

  featuredTitle: {
    color: THEME.white,
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: -0.65,
    lineHeight: 30,
    maxWidth: "90%",
  },

  featuredMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 13,
  },

  featuredMetaItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },

  featuredMetaText: {
    color: THEME.white,
    fontSize: 13,
    fontWeight: "700",
    maxWidth: 130,
  },

  browseSection: {
    marginBottom: 29,
  },

  seeAllText: {
    color: THEME.primary,
    fontSize: 14,
    fontWeight: "800",
  },

  categoryScrollContent: {
    gap: 9,
    paddingRight: 20,
  },

  categoryPill: {
    alignItems: "center",
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },

  categoryPillSelected: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },

  categoryPillText: {
    color: THEME.primary,
    fontSize: 13,
    fontWeight: "700",
  },

  categoryPillTextSelected: {
    color: THEME.white,
  },

  recipeSection: {
    marginBottom: 4,
  },

  recipeGridHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  recipeGridTitle: {
    color: THEME.ink,
    fontSize: 23,
    fontWeight: "800",
    letterSpacing: -0.55,
  },

  recipeGridSubtitle: {
    color: THEME.muted,
    fontSize: 13,
    fontWeight: "500",
    marginTop: 3,
  },

  gridButton: {
    alignItems: "center",
    backgroundColor: THEME.sage,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },

  recipeGrid: {
    gap: 14,
  },

  recipeRow: {
    gap: 14,
    justifyContent: "space-between",
  },

  recipeTile: {
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    maxWidth: "48%",
    overflow: "hidden",
  },

  recipeImageContainer: {
    backgroundColor: THEME.sage,
    height: 132,
    position: "relative",
  },

  recipeImage: {
    height: "100%",
    width: "100%",
  },

  recipeImageFallback: {
    alignItems: "center",
    backgroundColor: THEME.sage,
    height: "100%",
    justifyContent: "center",
    width: "100%",
  },

  recipeHeart: {
    alignItems: "center",
    backgroundColor: THEME.white,
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    position: "absolute",
    right: 9,
    top: 9,
    width: 32,
  },

  recipeTileContent: {
    minHeight: 93,
    padding: 12,
  },

  recipeTileTitle: {
    color: THEME.ink,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
  },

  recipeTileMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginTop: 8,
  },

  recipeTileMetaText: {
    color: THEME.muted,
    fontSize: 12,
    fontWeight: "600",
  },

  emptyState: {
    alignItems: "center",
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
    borderRadius: 24,
    borderStyle: "dashed",
    borderWidth: 1,
    paddingHorizontal: 30,
    paddingVertical: 35,
  },

  emptyIcon: {
    alignItems: "center",
    backgroundColor: THEME.sage,
    borderRadius: 26,
    height: 52,
    justifyContent: "center",
    marginBottom: 14,
    width: 52,
  },

  emptyTitle: {
    color: THEME.ink,
    fontSize: 18,
    fontWeight: "800",
  },

  emptyDescription: {
    color: THEME.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 7,
    textAlign: "center",
  },

  emptyButton: {
    backgroundColor: THEME.primary,
    borderRadius: 14,
    marginTop: 17,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },

  emptyButtonText: {
    color: THEME.white,
    fontSize: 14,
    fontWeight: "800",
  },

  bottomSpace: {
    height: 30,
  },
});

export default HomeScreen;