import {
  View,
  Text,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/expo";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { API_URL } from "../../constants/api";
import { MealAPI } from "../../services/mealAPI";
import { COLORS } from "../../constants/colors";
import { recipeDetailStyles } from "../../assets/styles/recipe-detail.styles";
import LoadingSpinner from "../../components/LoadingSpinner";

const getInstructionText = (instruction) => {
  if (typeof instruction === "string") {
    return instruction;
  }

  if (instruction && typeof instruction === "object") {
    return instruction.instruction || instruction.text || "";
  }

  return "";
};

const getIngredientData = (ingredient, index) => {
  if (typeof ingredient === "string") {
    return {
      id: `ingredient-${index}`,
      name: ingredient,
      measure: "As needed",
      imageUrl: null,
    };
  }

  return {
    id: ingredient?.id || `ingredient-${index}`,
    name: ingredient?.name || ingredient?.label || "Ingredient",
    measure:
      ingredient?.measure ||
      ingredient?.amount ||
      ingredient?.label ||
      "As needed",
    imageUrl: ingredient?.imageUrl || ingredient?.image || null,
  };
};

const RecipeDetailScreen = () => {
  const { id: recipeId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useUser();

  const userId = user?.id;

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [completedIngredients, setCompletedIngredients] = useState([]);
  const [completedSteps, setCompletedSteps] = useState([]);

  const showMessage = (title, message) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
      return;
    }

    Alert.alert(title, message);
  };

  useEffect(() => {
    const loadRecipeDetails = async () => {
      setLoading(true);

      try {
        const mealData = await MealAPI.getMealById(recipeId);

        if (!mealData) {
          setRecipe(null);
          return;
        }

        const transformedRecipe = MealAPI.transformMealData(mealData);

        setRecipe({
          ...transformedRecipe,
          ingredients: Array.isArray(transformedRecipe.ingredients)
            ? transformedRecipe.ingredients
            : [],
          instructions: Array.isArray(transformedRecipe.instructions)
            ? transformedRecipe.instructions
            : [],
        });
      } catch (error) {
        console.error("Error loading recipe details:", error);
        setRecipe(null);
      } finally {
        setLoading(false);
      }
    };

    loadRecipeDetails();
  }, [recipeId]);

  useEffect(() => {
    const checkIfSaved = async () => {
      if (!userId || !recipeId) {
        return;
      }

      try {
        const response = await fetch(`${API_URL}/favorites/${userId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch favorites: ${response.status}`);
        }

        const favorites = await response.json();

        const recipeIsSaved = favorites.some(
          (favorite) =>
            Number(favorite.recipeId) === Number(recipeId)
        );

        setIsSaved(recipeIsSaved);
      } catch (error) {
        console.error("Error checking saved recipe:", error);
      }
    };

    checkIfSaved();
  }, [recipeId, userId]);

  const getYouTubeEmbedUrl = (url) => {
    if (!url) {
      return null;
    }

    try {
      const parsedUrl = new URL(url);

      if (parsedUrl.hostname.includes("youtu.be")) {
        return `https://www.youtube.com/embed/${parsedUrl.pathname.slice(1)}`;
      }

      const videoId = parsedUrl.searchParams.get("v");

      return videoId
        ? `https://www.youtube.com/embed/${videoId}`
        : null;
    } catch {
      return null;
    }
  };

  const toggleIngredient = (ingredientId) => {
    setCompletedIngredients((currentIngredients) => {
      if (currentIngredients.includes(ingredientId)) {
        return currentIngredients.filter((id) => id !== ingredientId);
      }

      return [...currentIngredients, ingredientId];
    });
  };

  const toggleStep = (stepIndex) => {
    setCompletedSteps((currentSteps) => {
      if (currentSteps.includes(stepIndex)) {
        return currentSteps.filter((index) => index !== stepIndex);
      }

      return [...currentSteps, stepIndex];
    });
  };

  const handleToggleSave = async () => {
    if (!userId) {
      showMessage(
        "Sign in required",
        "Please sign in before saving recipes."
      );
      return;
    }

    if (!recipe || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      if (isSaved) {
        const response = await fetch(
          `${API_URL}/favorites/${userId}/${recipeId}`,
          {
            method: "DELETE",
          }
        );

        const responseText = await response.text();

        let responseData = {};

        try {
          responseData = responseText
            ? JSON.parse(responseText)
            : {};
        } catch {
          responseData = { message: responseText };
        }

        if (!response.ok) {
          throw new Error(
            responseData.message || "Failed to remove recipe."
          );
        }

        setIsSaved(false);

        showMessage(
          "Removed",
          "The recipe was removed from your favorites."
        );
      } else {
        const payload = {
          userId,
          recipeId: Number(recipeId),
          title: recipe.title,
          image: recipe.image,
          cookTime: recipe.cookTime,
          servings: String(recipe.servings ?? ""),
        };

        const response = await fetch(`${API_URL}/favorites`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const responseText = await response.text();

        let responseData = {};

        try {
          responseData = responseText
            ? JSON.parse(responseText)
            : {};
        } catch {
          responseData = { message: responseText };
        }

        if (!response.ok) {
          throw new Error(
            responseData.message || "Failed to save recipe."
          );
        }

        setIsSaved(true);

        showMessage(
          "Recipe saved",
          "The recipe was added to your favorites."
        );
      }
    } catch (error) {
      console.error("Error updating favorite:", error);

      showMessage(
        "Something went wrong",
        error.message || "Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading recipe details..." />;
  }

  if (!recipe) {
    return (
      <View style={recipeDetailStyles.container}>
        <View style={recipeDetailStyles.notFoundContainer}>
          <Ionicons
            name="restaurant-outline"
            size={72}
            color={COLORS.primary}
          />

          <Text style={recipeDetailStyles.notFoundTitle}>
            Recipe not found
          </Text>

          <Text style={recipeDetailStyles.notFoundDescription}>
            We could not load this recipe. Check your connection and
            try again.
          </Text>

          <TouchableOpacity
            style={recipeDetailStyles.notFoundButton}
            onPress={() => router.back()}
          >
            <Text style={recipeDetailStyles.notFoundButtonText}>
              Go back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const youtubeEmbedUrl = getYouTubeEmbedUrl(recipe.youtubeUrl);

  return (
    <View style={recipeDetailStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={recipeDetailStyles.headerContainer}>
          <View style={recipeDetailStyles.imageContainer}>
            <Image
              source={{ uri: recipe.image }}
              style={recipeDetailStyles.headerImage}
              contentFit="cover"
              transition={400}
            />
          </View>

          <LinearGradient
            colors={[
              "transparent",
              "rgba(0,0,0,0.45)",
              "rgba(0,0,0,0.92)",
            ]}
            style={recipeDetailStyles.gradientOverlay}
          />

          <View style={recipeDetailStyles.floatingButtons}>
            <TouchableOpacity
              style={recipeDetailStyles.floatingButton}
              onPress={() => router.back()}
              accessibilityLabel="Go back"
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={COLORS.white}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                recipeDetailStyles.floatingButton,
                {
                  backgroundColor: isSaving
                    ? COLORS.textLight
                    : COLORS.primary,
                },
              ]}
              onPress={handleToggleSave}
              disabled={isSaving}
            >
              <Ionicons
                name={
                  isSaving
                    ? "hourglass-outline"
                    : isSaved
                      ? "bookmark"
                      : "bookmark-outline"
                }
                size={24}
                color={COLORS.white}
              />
            </TouchableOpacity>
          </View>

          <View style={recipeDetailStyles.titleSection}>
            <View style={recipeDetailStyles.categoryBadge}>
              <Text style={recipeDetailStyles.categoryText}>
                {recipe.category || "Recipe"}
              </Text>
            </View>

            <Text style={recipeDetailStyles.recipeTitle}>
              {recipe.title}
            </Text>

            {recipe.area && (
              <View style={recipeDetailStyles.locationRow}>
                <Ionicons
                  name="location"
                  size={16}
                  color={COLORS.white}
                />

                <Text style={recipeDetailStyles.locationText}>
                  {recipe.area} cuisine
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={recipeDetailStyles.contentSection}>
          <View style={recipeDetailStyles.statsContainer}>
            <View style={recipeDetailStyles.statCard}>
              <LinearGradient
                colors={["#FF6B6B", "#FF8E53"]}
                style={recipeDetailStyles.statIconContainer}
              >
                <Ionicons
                  name="time"
                  size={20}
                  color={COLORS.white}
                />
              </LinearGradient>

              <Text style={recipeDetailStyles.statValue}>
                {recipe.cookTime || "—"}
              </Text>

              <Text style={recipeDetailStyles.statLabel}>
                Cooking time
              </Text>
            </View>

            <View style={recipeDetailStyles.statCard}>
              <LinearGradient
                colors={["#4ECDC4", "#44A08D"]}
                style={recipeDetailStyles.statIconContainer}
              >
                <Ionicons
                  name="people"
                  size={20}
                  color={COLORS.white}
                />
              </LinearGradient>

              <Text style={recipeDetailStyles.statValue}>
                {recipe.servings || "—"}
              </Text>

              <Text style={recipeDetailStyles.statLabel}>
                Servings
              </Text>
            </View>
          </View>

          {youtubeEmbedUrl && (
            <View style={recipeDetailStyles.sectionContainer}>
              <View style={recipeDetailStyles.sectionTitleRow}>
                <LinearGradient
                  colors={["#FF0000", "#CC0000"]}
                  style={recipeDetailStyles.sectionIcon}
                >
                  <Ionicons
                    name="play"
                    size={16}
                    color={COLORS.white}
                  />
                </LinearGradient>

                <Text style={recipeDetailStyles.sectionTitle}>
                  Video tutorial
                </Text>
              </View>

              <View style={recipeDetailStyles.videoCard}>
                {Platform.OS === "web" ? (
                  <iframe
                    src={youtubeEmbedUrl}
                    title={`${recipe.title} video tutorial`}
                    width="100%"
                    height="100%"
                    style={{
                      border: "none",
                      width: "100%",
                      height: "100%",
                      borderRadius: 16,
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  (() => {
                    const { WebView } = require("react-native-webview");

                    return (
                      <WebView
                        style={recipeDetailStyles.webview}
                        source={{ uri: youtubeEmbedUrl }}
                        allowsFullscreenVideo
                        mediaPlaybackRequiresUserAction={false}
                      />
                    );
                  })()
                )}
              </View>
            </View>
          )}

          <View style={recipeDetailStyles.sectionContainer}>
            <View style={recipeDetailStyles.sectionTitleRow}>
              <LinearGradient
                colors={[COLORS.primary, `${COLORS.primary}80`]}
                style={recipeDetailStyles.sectionIcon}
              >
                <Ionicons
                  name="basket"
                  size={16}
                  color={COLORS.white}
                />
              </LinearGradient>

              <Text style={recipeDetailStyles.sectionTitle}>
                Ingredients
              </Text>

              <View style={recipeDetailStyles.countBadge}>
                <Text style={recipeDetailStyles.countText}>
                  {recipe.ingredients.length}
                </Text>
              </View>
            </View>

            <Text style={recipeDetailStyles.sectionDescription}>
              Tap an ingredient after you have prepared it.
            </Text>

            <View style={recipeDetailStyles.ingredientsGrid}>
              {recipe.ingredients.map((ingredient, index) => {
                const ingredientData = getIngredientData(
                  ingredient,
                  index
                );
                const isCompleted = completedIngredients.includes(
                  ingredientData.id
                );

                return (
                  <TouchableOpacity
                    key={ingredientData.id}
                    style={[
                      recipeDetailStyles.ingredientCard,
                      isCompleted &&
                        recipeDetailStyles.ingredientCardCompleted,
                    ]}
                    onPress={() =>
                      toggleIngredient(ingredientData.id)
                    }
                    activeOpacity={0.8}
                  >
                    <View
                      style={
                        recipeDetailStyles.ingredientImageContainer
                      }
                    >
                      {ingredientData.imageUrl ? (
                        <Image
                          source={{ uri: ingredientData.imageUrl }}
                          style={recipeDetailStyles.ingredientImage}
                          contentFit="contain"
                          transition={250}
                        />
                      ) : (
                        <Ionicons
                          name="leaf-outline"
                          size={42}
                          color={COLORS.primary}
                        />
                      )}

                      <View
                        style={recipeDetailStyles.ingredientNumber}
                      >
                        <Text
                          style={
                            recipeDetailStyles.ingredientNumberText
                          }
                        >
                          {index + 1}
                        </Text>
                      </View>

                      {isCompleted && (
                        <View
                          style={
                            recipeDetailStyles.ingredientCompletedBadge
                          }
                        >
                          <Ionicons
                            name="checkmark"
                            size={17}
                            color={COLORS.white}
                          />
                        </View>
                      )}
                    </View>

                    <View style={recipeDetailStyles.ingredientInfo}>
                      <Text
                        style={[
                          recipeDetailStyles.ingredientName,
                          isCompleted &&
                            recipeDetailStyles.completedText,
                        ]}
                        numberOfLines={2}
                      >
                        {ingredientData.name}
                      </Text>

                      <Text
                        style={[
                          recipeDetailStyles.ingredientMeasure,
                          isCompleted &&
                            recipeDetailStyles.completedText,
                        ]}
                        numberOfLines={2}
                      >
                        {ingredientData.measure}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={recipeDetailStyles.sectionContainer}>
            <View style={recipeDetailStyles.sectionTitleRow}>
              <LinearGradient
                colors={["#9C27B0", "#673AB7"]}
                style={recipeDetailStyles.sectionIcon}
              >
                <Ionicons
                  name="book"
                  size={16}
                  color={COLORS.white}
                />
              </LinearGradient>

              <Text style={recipeDetailStyles.sectionTitle}>
                Instructions
              </Text>

              <View style={recipeDetailStyles.countBadge}>
                <Text style={recipeDetailStyles.countText}>
                  {recipe.instructions.length}
                </Text>
              </View>
            </View>

            <Text style={recipeDetailStyles.sectionDescription}>
              Follow each step and mark it complete as you cook.
            </Text>

            <View style={recipeDetailStyles.instructionsContainer}>
              {recipe.instructions.map((instruction, index) => {
                const isCompleted = completedSteps.includes(index);
                const instructionText = getInstructionText(instruction);

                return (
                  <View
                    key={`${recipe.id || recipeId}-step-${index}`}
                    style={[
                      recipeDetailStyles.instructionCard,
                      isCompleted &&
                        recipeDetailStyles.instructionCardCompleted,
                    ]}
                  >
                    <LinearGradient
                      colors={
                        isCompleted
                          ? ["#4ECDC4", "#44A08D"]
                          : [
                              COLORS.primary,
                              `${COLORS.primary}CC`,
                            ]
                      }
                      style={recipeDetailStyles.stepIndicator}
                    >
                      {isCompleted ? (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={COLORS.white}
                        />
                      ) : (
                        <Text style={recipeDetailStyles.stepNumber}>
                          {index + 1}
                        </Text>
                      )}
                    </LinearGradient>

                    <View
                      style={recipeDetailStyles.instructionContent}
                    >
                      <Text
                        style={[
                          recipeDetailStyles.instructionText,
                          isCompleted &&
                            recipeDetailStyles.completedText,
                        ]}
                      >
                        {instructionText || "Instruction unavailable."}
                      </Text>

                      <View
                        style={
                          recipeDetailStyles.instructionFooter
                        }
                      >
                        <Text style={recipeDetailStyles.stepLabel}>
                          Step {index + 1}
                        </Text>

                        <TouchableOpacity
                          style={[
                            recipeDetailStyles.completeButton,
                            isCompleted &&
                              recipeDetailStyles.completeButtonActive,
                          ]}
                          onPress={() => toggleStep(index)}
                        >
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color={
                              isCompleted
                                ? COLORS.white
                                : COLORS.primary
                            }
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            style={recipeDetailStyles.primaryButton}
            onPress={handleToggleSave}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[
                COLORS.primary,
                `${COLORS.primary}CC`,
              ]}
              style={recipeDetailStyles.buttonGradient}
            >
              <Ionicons
                name={
                  isSaving
                    ? "hourglass-outline"
                    : isSaved
                      ? "bookmark"
                      : "bookmark-outline"
                }
                size={20}
                color={COLORS.white}
              />

              <Text style={recipeDetailStyles.buttonText}>
                {isSaving
                  ? "Updating..."
                  : isSaved
                    ? "Remove from favorites"
                    : "Save to favorites"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default RecipeDetailScreen;