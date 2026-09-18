import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { Ionicons } from "@expo/vector-icons";

import { MealAPI } from "../../services/mealAPI";
import { useDebounce } from "../../hooks/useDebounce";
import { searchStyles } from "../../assets/styles/search.styles";
import { COLORS } from "../../constants/colors";
import RecipeCard from "../../components/RecipeCard";
import LoadingSpinner from "../../components/LoadingSpinner";

const QUICK_SEARCHES = [
  "Chicken",
  "Pasta",
  "Rice",
  "Beef",
  "Salmon",
  "Vegetarian",
];

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState("recipe");
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const requestId = useRef(0);

  const debouncedSearchQuery = useDebounce(searchQuery, 350);

  const performSearch = async (query, mode) => {
    const cleanedQuery = query.trim();

    if (!cleanedQuery) {
      const randomMeals = await MealAPI.getRandomMeals(12);

      return randomMeals
        .map((meal) => MealAPI.transformMealData(meal))
        .filter(Boolean);
    }

    if (mode === "ingredient") {
      const ingredientResults =
        await MealAPI.filterByIngredient(cleanedQuery);

      return ingredientResults
        .slice(0, 12)
        .map((meal) => MealAPI.transformMealData(meal))
        .filter(Boolean);
    }

    const recipeNameResults =
      await MealAPI.searchMealsByName(cleanedQuery);

    let results = recipeNameResults;

    /*
     * If no recipe title matches, try the same word
     * as an ingredient. Example: "cilantro".
     */
    if (results.length === 0) {
      results = await MealAPI.filterByIngredient(cleanedQuery);
    }

    return results
      .slice(0, 12)
      .map((meal) => MealAPI.transformMealData(meal))
      .filter(Boolean);
  };

  useEffect(() => {
    const searchRecipes = async () => {
      const currentRequest = requestId.current + 1;
      requestId.current = currentRequest;

      if (initialLoading) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }

      try {
        const results = await performSearch(
          debouncedSearchQuery,
          searchMode
        );

        /*
         * Do not show results from an older request
         * after the user types something newer.
         */
        if (currentRequest === requestId.current) {
          setRecipes(results);
        }
      } catch (error) {
        console.error("Error searching recipes:", error);

        if (currentRequest === requestId.current) {
          setRecipes([]);
        }
      } finally {
        if (currentRequest === requestId.current) {
          setLoading(false);
          setInitialLoading(false);
        }
      }
    };

    searchRecipes();
  }, [debouncedSearchQuery, searchMode]);

  const selectQuickSearch = (search) => {
    setSearchQuery(search);
    setSearchMode(
      search === "Vegetarian"
        ? "recipe"
        : "ingredient"
    );
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchMode("recipe");
  };

  const getResultsTitle = () => {
    if (!searchQuery.trim()) {
      return "Explore recipes";
    }

    if (searchMode === "ingredient") {
      return `Made with "${searchQuery.trim()}"`;
    }

    return `Results for "${searchQuery.trim()}"`;
  };

  const renderListHeader = () => {
    return (
      <>
        <View style={searchStyles.heroSection}>
          <Text style={searchStyles.eyebrow}>
            DISCOVER SOMETHING DELICIOUS
          </Text>

          <Text style={searchStyles.heroTitle}>
            What are you cooking today?
          </Text>

          <Text style={searchStyles.heroSubtitle}>
            Search by a dish name or the ingredients already in your kitchen.
          </Text>
        </View>

        <View style={searchStyles.searchContainer}>
          <Ionicons
            name="search"
            size={21}
            color={COLORS.textLight}
          />

          <TextInput
            style={searchStyles.searchInput}
            placeholder={
              searchMode === "ingredient"
                ? "Try chicken, cilantro, or rice"
                : "Try pho, pasta, or tacos"
            }
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="words"
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={clearSearch}
              style={searchStyles.clearButton}
              accessibilityLabel="Clear search"
            >
              <Ionicons
                name="close-circle"
                size={21}
                color={COLORS.textLight}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={searchStyles.modeContainer}>
          <TouchableOpacity
            onPress={() => setSearchMode("recipe")}
            style={[
              searchStyles.modeButton,
              searchMode === "recipe" &&
                searchStyles.activeModeButton,
            ]}
            activeOpacity={0.8}
          >
            <Ionicons
              name="restaurant-outline"
              size={16}
              color={
                searchMode === "recipe"
                  ? COLORS.white
                  : COLORS.text
              }
            />

            <Text
              style={[
                searchStyles.modeButtonText,
                searchMode === "recipe" &&
                  searchStyles.activeModeButtonText,
              ]}
            >
              Recipe name
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSearchMode("ingredient")}
            style={[
              searchStyles.modeButton,
              searchMode === "ingredient" &&
                searchStyles.activeModeButton,
            ]}
            activeOpacity={0.8}
          >
            <Ionicons
              name="leaf-outline"
              size={16}
              color={
                searchMode === "ingredient"
                  ? COLORS.white
                  : COLORS.text
              }
            />

            <Text
              style={[
                searchStyles.modeButtonText,
                searchMode === "ingredient" &&
                  searchStyles.activeModeButtonText,
              ]}
            >
              Ingredient
            </Text>
          </TouchableOpacity>
        </View>

        <View style={searchStyles.quickSearchSection}>
          <View style={searchStyles.quickSearchHeader}>
            <Text style={searchStyles.quickSearchTitle}>
              Quick search
            </Text>

            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <Text style={searchStyles.resetText}>
                  Reset
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={searchStyles.quickSearchList}
          >
            {QUICK_SEARCHES.map((search) => {
              const isActive =
                search.toLowerCase() ===
                searchQuery.trim().toLowerCase();

              return (
                <TouchableOpacity
                  key={search}
                  onPress={() => selectQuickSearch(search)}
                  style={[
                    searchStyles.quickSearchChip,
                    isActive &&
                      searchStyles.activeQuickSearchChip,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      searchStyles.quickSearchChipText,
                      isActive &&
                        searchStyles.activeQuickSearchChipText,
                    ]}
                  >
                    {search}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={searchStyles.resultsHeader}>
          <View style={searchStyles.resultsHeading}>
            <Text style={searchStyles.resultsTitle}>
              {getResultsTitle()}
            </Text>

            <Text style={searchStyles.resultsDescription}>
              {searchQuery.trim()
                ? searchMode === "ingredient"
                  ? "Recipes using this ingredient"
                  : "Best matching recipes"
                : "Fresh ideas selected for you"}
            </Text>
          </View>

          <View style={searchStyles.countBadge}>
            <Text style={searchStyles.countBadgeText}>
              {loading ? "..." : recipes.length}
            </Text>
          </View>
        </View>
      </>
    );
  };

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={searchStyles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />

          <Text style={searchStyles.loadingText}>
            Finding recipes for you...
          </Text>
        </View>
      );
    }

    return (
      <View style={searchStyles.emptyState}>
        <View style={searchStyles.emptyIconContainer}>
          <Ionicons
            name="search-outline"
            size={42}
            color={COLORS.primary}
          />
        </View>

        <Text style={searchStyles.emptyTitle}>
          No recipes found
        </Text>

        <Text style={searchStyles.emptyDescription}>
          Try another dish name, switch to Ingredient search, or choose a quick search above.
        </Text>

        <TouchableOpacity
          onPress={clearSearch}
          style={searchStyles.emptyButton}
        >
          <Text style={searchStyles.emptyButtonText}>
            Explore recipes
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (initialLoading) {
    return (
      <LoadingSpinner message="Preparing recipe ideas..." />
    );
  }

  return (
    <View style={searchStyles.container}>
      <FlatList
        data={loading ? [] : recipes}
        renderItem={({ item }) => (
          <RecipeCard recipe={item} />
        )}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={
          recipes.length > 1
            ? searchStyles.row
            : undefined
        }
        contentContainerStyle={searchStyles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
};

export default SearchScreen;