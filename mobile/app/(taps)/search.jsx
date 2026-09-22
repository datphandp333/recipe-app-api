import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { MealAPI } from "../../services/mealAPI";
import { useDebounce } from "../../hooks/useDebounce";
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
};

const QUICK_SEARCHES = [
  {
    label: "Chicken",
    icon: "restaurant-outline",
    mode: "ingredient",
  },
  {
    label: "Pasta",
    icon: "nutrition-outline",
    mode: "recipe",
  },
  {
    label: "Rice",
    icon: "restaurant-outline",
    mode: "ingredient",
  },
  {
    label: "Beef",
    icon: "flame-outline",
    mode: "ingredient",
  },
  {
    label: "Salmon",
    icon: "fish-outline",
    mode: "ingredient",
  },
  {
    label: "Vegetarian",
    icon: "leaf-outline",
    mode: "recipe",
  },
];

const SearchRecipeCard = ({ recipe }) => {
  const [showImage, setShowImage] =
    useState(Boolean(recipe?.image));

  return (
    <TouchableOpacity
      style={styles.recipeCard}
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
              size={31}
              color={THEME.primary}
            />
          </View>
        )}

        <View style={styles.discoverBadge}>
          <Ionicons
            name="sparkles"
            size={12}
            color={THEME.primaryDark}
          />

          <Text style={styles.discoverBadgeText}>
            Try this
          </Text>
        </View>
      </View>

      <View style={styles.recipeCardContent}>
        <Text
          style={styles.recipeTitle}
          numberOfLines={2}
        >
          {recipe.title}
        </Text>

        <View style={styles.recipeMeta}>
          <Ionicons
            name="time-outline"
            size={14}
            color={THEME.coral}
          />

          <Text
            style={styles.recipeMetaText}
            numberOfLines={1}
          >
            {recipe.cookTime || "Easy meal"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] =
    useState("");

  const [searchMode, setSearchMode] =
    useState("recipe");

  const [recipes, setRecipes] = useState([]);

  const [loading, setLoading] =
    useState(false);

  const [initialLoading, setInitialLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const requestId = useRef(0);

  const debouncedSearchQuery = useDebounce(
    searchQuery,
    350
  );

  const performSearch = async (
    query,
    mode
  ) => {
    const cleanedQuery = query.trim();

    if (!cleanedQuery) {
      const randomMeals =
        await MealAPI.getRandomMeals(12);

      return randomMeals
        .map((meal) =>
          MealAPI.transformMealData(meal)
        )
        .filter(Boolean);
    }

    if (mode === "ingredient") {
      const ingredientResults =
        await MealAPI.filterByIngredient(
          cleanedQuery
        );

      return ingredientResults
        .slice(0, 12)
        .map((meal) =>
          MealAPI.transformMealData(meal)
        )
        .filter(Boolean);
    }

    const recipeNameResults =
      await MealAPI.searchMealsByName(
        cleanedQuery
      );

    let results = recipeNameResults;

    if (results.length === 0) {
      results =
        await MealAPI.filterByIngredient(
          cleanedQuery
        );
    }

    return results
      .slice(0, 12)
      .map((meal) =>
        MealAPI.transformMealData(meal)
      )
      .filter(Boolean);
  };

  const searchRecipes = async ({
    isRefresh = false,
  } = {}) => {
    const currentRequest =
      requestId.current + 1;

    requestId.current = currentRequest;

    if (isRefresh) {
      setRefreshing(true);
    } else if (initialLoading) {
      setInitialLoading(true);
    } else {
      setLoading(true);
    }

    try {
      const results = await performSearch(
        debouncedSearchQuery,
        searchMode
      );

      if (
        currentRequest === requestId.current
      ) {
        setRecipes(results);
      }
    } catch (error) {
      console.error(
        "Error searching recipes:",
        error
      );

      if (
        currentRequest === requestId.current
      ) {
        setRecipes([]);
      }
    } finally {
      if (
        currentRequest === requestId.current
      ) {
        setLoading(false);
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    searchRecipes();
  }, [
    debouncedSearchQuery,
    searchMode,
  ]);

  const selectQuickSearch = (search) => {
    setSearchMode(search.mode);
    setSearchQuery(search.label);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchMode("recipe");
  };

  const getResultsTitle = () => {
    if (!searchQuery.trim()) {
      return "Fresh ideas for you";
    }

    if (searchMode === "ingredient") {
      return `Made with "${searchQuery.trim()}"`;
    }

    return `Results for "${searchQuery.trim()}"`;
  };

  const renderListHeader = () => {
    return (
      <>
        <View style={styles.heroCard}>
          <View style={styles.heroDecorOne} />
          <View style={styles.heroDecorTwo} />

          <View style={styles.heroIcon}>
            <Ionicons
              name="compass-outline"
              size={26}
              color={THEME.primary}
            />
          </View>

          <Text style={styles.eyebrow}>
            DISCOVER YOUR NEXT DISH
          </Text>

          <Text style={styles.heroTitle}>
            Search by craving or ingredient
          </Text>

          <Text style={styles.heroSubtitle}>
            Find a recipe by name, or turn what
            you already have into dinner.
          </Text>
        </View>

        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={21}
            color={THEME.muted}
          />

          <TextInput
            style={styles.searchInput}
            placeholder={
              searchMode === "ingredient"
                ? "Chicken, cilantro, rice..."
                : "Pho, tacos, pasta..."
            }
            placeholderTextColor={THEME.softText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="words"
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearSearch}
              activeOpacity={0.8}
              accessibilityLabel="Clear search"
            >
              <Ionicons
                name="close"
                size={17}
                color={THEME.white}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              searchMode === "recipe" &&
                styles.modeButtonActive,
            ]}
            onPress={() =>
              setSearchMode("recipe")
            }
            activeOpacity={0.85}
          >
            <Ionicons
              name="restaurant-outline"
              size={16}
              color={
                searchMode === "recipe"
                  ? THEME.white
                  : THEME.primary
              }
            />

            <Text
              style={[
                styles.modeButtonText,
                searchMode === "recipe" &&
                  styles.modeButtonTextActive,
              ]}
            >
              Recipe name
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              searchMode === "ingredient" &&
                styles.modeButtonActive,
            ]}
            onPress={() =>
              setSearchMode("ingredient")
            }
            activeOpacity={0.85}
          >
            <Ionicons
              name="leaf-outline"
              size={16}
              color={
                searchMode === "ingredient"
                  ? THEME.white
                  : THEME.primary
              }
            />

            <Text
              style={[
                styles.modeButtonText,
                searchMode === "ingredient" &&
                  styles.modeButtonTextActive,
              ]}
            >
              Ingredient
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickSection}>
          <View style={styles.quickHeader}>
            <View>
              <Text style={styles.quickEyebrow}>
                START WITH A CRAVING
              </Text>

              <Text style={styles.quickTitle}>
                Popular searches
              </Text>
            </View>

            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={clearSearch}
                activeOpacity={0.8}
              >
                <Text style={styles.resetText}>
                  Reset
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipList}
          >
            {QUICK_SEARCHES.map((search) => {
              const isActive =
                search.label.toLowerCase() ===
                searchQuery
                  .trim()
                  .toLowerCase();

              return (
                <TouchableOpacity
                  key={search.label}
                  style={[
                    styles.quickChip,
                    isActive &&
                      styles.quickChipActive,
                  ]}
                  onPress={() =>
                    selectQuickSearch(search)
                  }
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={search.icon}
                    size={15}
                    color={
                      isActive
                        ? THEME.white
                        : THEME.primary
                    }
                  />

                  <Text
                    style={[
                      styles.quickChipText,
                      isActive &&
                        styles.quickChipTextActive,
                    ]}
                  >
                    {search.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.resultsHeader}>
          <View style={styles.resultsHeading}>
            <Text style={styles.resultsEyebrow}>
              RECIPE RESULTS
            </Text>

            <Text style={styles.resultsTitle}>
              {getResultsTitle()}
            </Text>

            <Text style={styles.resultsDescription}>
              {searchQuery.trim()
                ? searchMode === "ingredient"
                  ? "Recipes that use this ingredient"
                  : "The best matching dishes"
                : "Fresh recipes selected for you"}
            </Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {loading ? "…" : recipes.length}
            </Text>
          </View>
        </View>
      </>
    );
  };

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator
            size="large"
            color={THEME.primary}
          />

          <Text style={styles.loadingText}>
            Looking for something delicious...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name="search-outline"
            size={39}
            color={THEME.primary}
          />
        </View>

        <Text style={styles.emptyTitle}>
          No dishes found
        </Text>

        <Text style={styles.emptyDescription}>
          Try a different dish name, switch to
          ingredient search, or start fresh.
        </Text>

        <TouchableOpacity
          style={styles.emptyButton}
          onPress={clearSearch}
          activeOpacity={0.85}
        >
          <Text style={styles.emptyButtonText}>
            Explore recipes
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (initialLoading) {
    return (
      <LoadingSpinner message="Finding something delicious..." />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={loading ? [] : recipes}
        renderItem={({ item }) => (
          <SearchRecipeCard recipe={item} />
        )}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={
          recipes.length > 1
            ? styles.recipeRow
            : undefined
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              searchRecipes({ isRefresh: true })
            }
            tintColor={THEME.primary}
            colors={[THEME.primary]}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.background,
  },

  listContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 130,
  },

  heroCard: {
    backgroundColor: THEME.cream,
    borderColor: "#F0DCA9",
    borderRadius: 27,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
    padding: 22,
  },

  heroDecorOne: {
    backgroundColor: THEME.saffron,
    borderRadius: 60,
    height: 120,
    opacity: 0.34,
    position: "absolute",
    right: -35,
    top: -53,
    width: 120,
  },

  heroDecorTwo: {
    backgroundColor: THEME.coral,
    borderRadius: 28,
    bottom: -25,
    height: 57,
    opacity: 0.16,
    position: "absolute",
    right: 48,
    width: 57,
  },

  heroIcon: {
    alignItems: "center",
    backgroundColor: THEME.white,
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    marginBottom: 16,
    width: 44,
  },

  eyebrow: {
    color: THEME.coralDark,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.05,
    marginBottom: 7,
  },

  heroTitle: {
    color: THEME.primaryDark,
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.75,
    lineHeight: 33,
    maxWidth: "94%",
  },

  heroSubtitle: {
    color: "#616760",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
    maxWidth: "94%",
  },

  searchBox: {
    alignItems: "center",
    backgroundColor: THEME.surface,
    borderColor: THEME.primary,
    borderRadius: 18,
    borderWidth: 1.5,
    flexDirection: "row",
    minHeight: 57,
    paddingHorizontal: 16,
  },

  searchInput: {
    color: THEME.ink,
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 10,
    paddingVertical: 14,
  },

  clearButton: {
    alignItems: "center",
    backgroundColor: THEME.primary,
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    width: 28,
  },

  modeRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  modeButton: {
    alignItems: "center",
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    paddingVertical: 12,
  },

  modeButtonActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },

  modeButtonText: {
    color: THEME.primary,
    fontSize: 13,
    fontWeight: "800",
  },

  modeButtonTextActive: {
    color: THEME.white,
  },

  quickSection: {
    marginTop: 29,
  },

  quickHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  quickEyebrow: {
    color: THEME.coral,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 3,
  },

  quickTitle: {
    color: THEME.ink,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  resetText: {
    color: THEME.primary,
    fontSize: 13,
    fontWeight: "800",
  },

  chipList: {
    gap: 9,
    paddingRight: 20,
  },

  quickChip: {
    alignItems: "center",
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },

  quickChipActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },

  quickChipText: {
    color: THEME.primary,
    fontSize: 13,
    fontWeight: "700",
  },

  quickChipTextActive: {
    color: THEME.white,
  },

  resultsHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    marginTop: 31,
  },

  resultsHeading: {
    flex: 1,
    paddingRight: 12,
  },

  resultsEyebrow: {
    color: THEME.coral,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 4,
  },

  resultsTitle: {
    color: THEME.ink,
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.45,
  },

  resultsDescription: {
    color: THEME.muted,
    fontSize: 13,
    marginTop: 3,
  },

  countBadge: {
    alignItems: "center",
    backgroundColor: THEME.sage,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },

  countBadgeText: {
    color: THEME.primary,
    fontSize: 15,
    fontWeight: "800",
  },

  recipeRow: {
    gap: 14,
    justifyContent: "space-between",
  },

  recipeCard: {
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    marginBottom: 15,
    maxWidth: "48%",
    overflow: "hidden",
  },

  recipeImageContainer: {
    backgroundColor: THEME.sage,
    height: 133,
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

  discoverBadge: {
    alignItems: "center",
    backgroundColor: THEME.saffron,
    borderRadius: 13,
    flexDirection: "row",
    gap: 4,
    left: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
    position: "absolute",
    top: 9,
  },

  discoverBadgeText: {
    color: THEME.primaryDark,
    fontSize: 10,
    fontWeight: "800",
  },

  recipeCardContent: {
    minHeight: 91,
    padding: 12,
  },

  recipeTitle: {
    color: THEME.ink,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
  },

  recipeMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginTop: 8,
  },

  recipeMetaText: {
    color: THEME.muted,
    fontSize: 12,
    fontWeight: "600",
  },

  loadingState: {
    alignItems: "center",
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 4,
    paddingVertical: 42,
  },

  loadingText: {
    color: THEME.muted,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 13,
  },

  emptyState: {
    alignItems: "center",
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
    borderRadius: 24,
    borderStyle: "dashed",
    borderWidth: 1,
    marginTop: 3,
    paddingHorizontal: 28,
    paddingVertical: 39,
  },

  emptyIcon: {
    alignItems: "center",
    backgroundColor: THEME.sage,
    borderRadius: 34,
    height: 68,
    justifyContent: "center",
    marginBottom: 16,
    width: 68,
  },

  emptyTitle: {
    color: THEME.ink,
    fontSize: 21,
    fontWeight: "800",
  },

  emptyDescription: {
    color: THEME.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    textAlign: "center",
  },

  emptyButton: {
    backgroundColor: THEME.primary,
    borderRadius: 13,
    marginTop: 19,
    paddingHorizontal: 17,
    paddingVertical: 12,
  },

  emptyButtonText: {
    color: THEME.white,
    fontSize: 13,
    fontWeight: "800",
  },
});

export default SearchScreen;