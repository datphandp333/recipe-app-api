import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { COLORS } from "../constants/colors";
import { MealAPI } from "../services/mealAPI";

const CUISINES = [
  "Any",
  "American",
  "Chinese",
  "Indian",
  "Italian",
  "Japanese",
  "Korean",
  "Mexican",
  "Thai",
  "Vietnamese",
];

const DIETARY_OPTIONS = [
  "None",
  "High protein",
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Low carb",
];

const COOKING_TIMES = [
  15,
  30,
  45,
  60,
];

const splitInput = (value) => {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const openLink = async (url) => {
  if (!url) {
    return;
  }

  try {
    const supported =
      await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    }
  } catch (error) {
    console.warn(
      "Could not open link:",
      error
    );
  }
};

const IngredientPicture = ({
  ingredient,
}) => {
  const [imageUrl, setImageUrl] =
    useState(
      ingredient?.imageUrl || null
    );

  const [pexelsPhoto, setPexelsPhoto] =
    useState(null);

  const [loadingFallback, setLoadingFallback] =
    useState(false);

  const [searchAttempted, setSearchAttempted] =
    useState(false);

  const loadPexelsFallback =
    async () => {
      if (
        searchAttempted ||
        loadingFallback
      ) {
        return;
      }

      setSearchAttempted(true);
      setLoadingFallback(true);

      const searchName =
        ingredient?.imageSearchName ||
        ingredient?.name;

      const photo =
        await MealAPI.searchIngredientPhoto(
          searchName
        );

      if (photo?.imageUrl) {
        setPexelsPhoto(photo);

        setImageUrl(
          photo.thumbnailUrl ||
            photo.imageUrl
        );
      } else {
        setImageUrl(null);
      }

      setLoadingFallback(false);
    };

  const handleImageError = () => {
    if (!searchAttempted) {
      loadPexelsFallback();
      return;
    }

    setImageUrl(null);
  };

  if (loadingFallback) {
    return (
      <View style={styles.imageFallback}>
        <ActivityIndicator
          size="small"
          color={COLORS.primary}
        />

        <Text
          style={
            styles.imageFallbackText
          }
        >
          Finding photo...
        </Text>
      </View>
    );
  }

  if (!imageUrl) {
    return (
      <View style={styles.imageFallback}>
        <View
          style={
            styles.imageFallbackCircle
          }
        >
          <Ionicons
            name="leaf-outline"
            size={32}
            color={COLORS.primary}
          />
        </View>

        <Text
          style={
            styles.imageFallbackText
          }
        >
          Photo unavailable
        </Text>

        {!searchAttempted && (
          <Pressable
            onPress={
              loadPexelsFallback
            }
            style={
              styles.findPhotoButton
            }
          >
            <Text
              style={
                styles.findPhotoButtonText
              }
            >
              Find photo
            </Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.ingredientPhoto}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.ingredientImage}
        contentFit="contain"
        transition={200}
        onError={handleImageError}
      />

      {pexelsPhoto && (
        <Pressable
          onPress={() =>
            openLink(
              pexelsPhoto.pexelsUrl
            )
          }
          style={
            styles.smallAttribution
          }
        >
          <Text
            style={
              styles.smallAttributionText
            }
            numberOfLines={1}
          >
            Photo by{" "}
            {pexelsPhoto.photographer}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

const MetadataItem = ({
  icon,
  value,
  label,
}) => {
  return (
    <View style={styles.metadataItem}>
      <Ionicons
        name={icon}
        size={21}
        color={COLORS.primary}
      />

      <Text style={styles.metadataValue}>
        {value}
      </Text>

      <Text style={styles.metadataLabel}>
        {label}
      </Text>
    </View>
  );
};

const DishPhoto = ({ recipe }) => {
  const photo = recipe?.dishPhoto;
  const imageUrl =
    photo?.landscapeUrl ||
    photo?.imageUrl ||
    recipe?.image;

  if (!imageUrl) {
    return null;
  }

  return (
    <View style={styles.dishPhotoContainer}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.dishPhoto}
        contentFit="cover"
        transition={300}
      />

      {photo?.provider === "Pexels" && (
        <View
          style={
            styles.dishPhotoAttribution
          }
        >
          <Pressable
            onPress={() =>
              openLink(
                photo.photographerUrl
              )
            }
          >
            <Text
              style={
                styles.dishPhotoCredit
              }
            >
              Photo by{" "}
              {photo.photographer}
            </Text>
          </Pressable>

          <Text
            style={
              styles.dishPhotoCredit
            }
          >
            {" "}on{" "}
          </Text>

          <Pressable
            onPress={() =>
              openLink(
                photo.pexelsUrl
              )
            }
          >
            <Text
              style={[
                styles.dishPhotoCredit,
                styles.attributionLink,
              ]}
            >
              Pexels
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const RecipeResult = ({ recipe }) => {
  const totalTime =
    recipe.totalTime ||
    Number(recipe.prepTime || 0) +
      Number(recipe.cookTime || 0);

  return (
    <View style={styles.recipeCard}>
      <DishPhoto recipe={recipe} />

      <LinearGradient
        colors={[
          COLORS.primary,
          COLORS.text,
        ]}
        style={styles.recipeHero}
      >
        <View style={styles.aiBadge}>
          <Ionicons
            name="sparkles"
            size={14}
            color={COLORS.primary}
          />

          <Text style={styles.aiBadgeText}>
            AI GENERATED
          </Text>
        </View>

        <Text style={styles.recipeTitle}>
          {recipe.title}
        </Text>

        <Text
          style={styles.recipeDescription}
        >
          {recipe.description}
        </Text>
      </LinearGradient>

      <View style={styles.recipeBody}>
        <View style={styles.recipeMetadata}>
          <MetadataItem
            icon="time-outline"
            value={`${totalTime || 0} min`}
            label="Total time"
          />

          <MetadataItem
            icon="people-outline"
            value={recipe.servings || 1}
            label="Servings"
          />

          <MetadataItem
            icon="flame-outline"
            value={
              recipe.caloriesPerServing ||
              "N/A"
            }
            label="Calories"
          />
        </View>

        {!!recipe.dietaryLabels?.length && (
          <View style={styles.labelContainer}>
            {recipe.dietaryLabels.map(
              (label) => (
                <View
                  key={label}
                  style={styles.dietaryLabel}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={15}
                    color="#2E7D32"
                  />

                  <Text
                    style={
                      styles.dietaryLabelText
                    }
                  >
                    {label}
                  </Text>
                </View>
              )
            )}
          </View>
        )}

        <View style={styles.resultSection}>
          <Text
            style={styles.resultSectionTitle}
          >
            Ingredients
          </Text>

          <Text
            style={
              styles.resultSectionSubtitle
            }
          >
            Pictures help you recognize each
            ingredient
          </Text>

          <View style={styles.ingredientGrid}>
            {recipe.ingredients?.map(
              (ingredient, index) => (
                <View
                  key={
                    ingredient.id ||
                    `${ingredient.name}-${index}`
                  }
                  style={styles.ingredientCard}
                >
                  <View
                    style={
                      styles.ingredientImageContainer
                    }
                  >
                    <IngredientPicture
                      ingredient={ingredient}
                    />
                  </View>

                  <Text
                    style={styles.ingredientName}
                    numberOfLines={2}
                  >
                    {ingredient.name}
                  </Text>

                  <Text
                    style={styles.ingredientAmount}
                  >
                    {ingredient.amount ||
                      ingredient.measure}
                  </Text>

                  {!!ingredient.preparation && (
                    <Text
                      style={
                        styles.ingredientPreparation
                      }
                    >
                      {ingredient.preparation}
                    </Text>
                  )}
                </View>
              )
            )}
          </View>
        </View>

        <View style={styles.resultSection}>
          <Text
            style={styles.resultSectionTitle}
          >
            Instructions
          </Text>

          {recipe.instructions?.map(
            (instruction, index) => (
              <View
                key={
                  instruction.step || index
                }
                style={styles.instructionRow}
              >
                <View style={styles.stepCircle}>
                  <Text style={styles.stepNumber}>
                    {instruction.step ||
                      index + 1}
                  </Text>
                </View>

                <Text
                  style={styles.instructionText}
                >
                  {instruction.instruction ||
                    instruction}
                </Text>
              </View>
            )
          )}
        </View>

        {!!recipe.tips?.length && (
          <View style={styles.tipBox}>
            <View style={styles.tipHeader}>
              <Ionicons
                name="bulb-outline"
                size={21}
                color="#B26A00"
              />

              <Text style={styles.tipTitle}>
                Chef tips
              </Text>
            </View>

            {recipe.tips.map(
              (tip, index) => (
                <Text
                  key={`${tip}-${index}`}
                  style={styles.tipText}
                >
                  • {tip}
                </Text>
              )
            )}
          </View>
        )}

        <View style={styles.generatedByRow}>
          <Ionicons
            name="logo-google"
            size={16}
            color={COLORS.textLight}
          />

          <Text
            style={styles.generatedByText}
          >
            Recipe generated by{" "}
            {recipe.generatedBy ||
              "Google Gemini"}
          </Text>
        </View>

        <Pressable
          onPress={() =>
            openLink(
              "https://www.pexels.com"
            )
          }
          style={
            styles.pexelsProviderLink
          }
        >
          <Text
            style={
              styles.pexelsProviderText
            }
          >
            Additional photos provided by Pexels
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const AiRecipeScreen = () => {
  const [dishName, setDishName] =
    useState("");

  const [
    ingredientInput,
    setIngredientInput,
  ] = useState("");

  const [
    selectedCuisine,
    setSelectedCuisine,
  ] = useState("Any");

  const [selectedDiet, setSelectedDiet] =
    useState("None");

  const [
    excludedInput,
    setExcludedInput,
  ] = useState("");

  const [
    maximumCookingTime,
    setMaximumCookingTime,
  ] = useState(45);

  const [servings, setServings] =
    useState(4);

  const [recipe, setRecipe] =
    useState(null);

  const [
    isGenerating,
    setIsGenerating,
  ] = useState(false);

  const ingredients = useMemo(
    () => splitInput(ingredientInput),
    [ingredientInput]
  );

  const excludedIngredients = useMemo(
    () => splitInput(excludedInput),
    [excludedInput]
  );

  const generateRecipe = async () => {
    const cleanedDishName =
      dishName.trim();

    if (
      !cleanedDishName &&
      ingredients.length === 0
    ) {
      Alert.alert(
        "Tell us what to cook",
        "Enter a dish name or at least one ingredient."
      );

      return;
    }

    try {
      setIsGenerating(true);
      setRecipe(null);

      const generatedRecipe =
        await MealAPI.generateAiRecipe({
          dishName: cleanedDishName,
          ingredients,
          cuisine:
            selectedCuisine === "Any"
              ? ""
              : selectedCuisine,
          dietaryPreference:
            selectedDiet === "None"
              ? ""
              : selectedDiet,
          excludedIngredients,
          maximumCookingTime,
          servings,
        });

      setRecipe(generatedRecipe);
    } catch (error) {
      console.error(
        "AI recipe generation failed:",
        error
      );

      Alert.alert(
        "Could not generate recipe",
        error?.message ||
          "Make sure the backend is running and try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const adjustServings = (amount) => {
    setServings((current) =>
      Math.min(
        12,
        Math.max(1, current + amount)
      )
    );
  };

  const resetGenerator = () => {
    setDishName("");
    setIngredientInput("");
    setSelectedCuisine("Any");
    setSelectedDiet("None");
    setExcludedInput("");
    setMaximumCookingTime(45);
    setServings(4);
    setRecipe(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            styles.scrollContent
          }
        >
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={COLORS.text}
              />
            </Pressable>

            <Text style={styles.headerTitle}>
              AI Recipe Chef
            </Text>

            <Pressable
              onPress={resetGenerator}
              style={styles.headerButton}
            >
              <Ionicons
                name="refresh-outline"
                size={23}
                color={COLORS.text}
              />
            </Pressable>
          </View>

          <LinearGradient
            colors={[
              COLORS.primary,
              COLORS.text,
            ]}
            style={styles.hero}
          >
            <View style={styles.heroIcon}>
              <Ionicons
                name="sparkles"
                size={28}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.heroTitle}>
              What do you want to cook?
            </Text>

            <Text style={styles.heroText}>
              Enter a dish, ingredients, or
              both. Gemini will create your
              personalized recipe.
            </Text>
          </LinearGradient>

          <View style={styles.formCard}>
            <Text
              style={styles.inputLabelFirst}
            >
              Dish you want to make
            </Text>

            <View style={styles.inputWithIcon}>
              <Ionicons
                name="restaurant-outline"
                size={21}
                color={COLORS.primary}
              />

              <TextInput
                style={styles.iconInput}
                value={dishName}
                onChangeText={setDishName}
                placeholder="Example: Vietnamese pho"
                placeholderTextColor={
                  COLORS.textLight
                }
              />
            </View>

            <Text style={styles.helperText}>
              Optional if you enter ingredients
              below
            </Text>

            <Text style={styles.inputLabel}>
              Ingredients you already have
            </Text>

            <TextInput
              style={styles.largeInput}
              value={ingredientInput}
              onChangeText={setIngredientInput}
              placeholder="Example: chicken, rice, cilantro"
              placeholderTextColor={
                COLORS.textLight
              }
              multiline
              textAlignVertical="top"
              autoCapitalize="none"
            />

            <Text style={styles.helperText}>
              Separate ingredients with commas
            </Text>

            {ingredients.length > 0 && (
              <View style={styles.chipContainer}>
                {ingredients.map(
                  (ingredient, index) => (
                    <View
                      key={`${ingredient}-${index}`}
                      style={styles.ingredientChip}
                    >
                      <Ionicons
                        name="leaf-outline"
                        size={14}
                        color={COLORS.primary}
                      />

                      <Text
                        style={
                          styles.ingredientChipText
                        }
                      >
                        {ingredient}
                      </Text>
                    </View>
                  )
                )}
              </View>
            )}

            <Text style={styles.inputLabel}>
              Cuisine
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.horizontalOptions
              }
            >
              {CUISINES.map((cuisine) => {
                const selected =
                  selectedCuisine === cuisine;

                return (
                  <Pressable
                    key={cuisine}
                    onPress={() =>
                      setSelectedCuisine(cuisine)
                    }
                    style={[
                      styles.optionChip,
                      selected &&
                        styles.optionChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        selected &&
                          styles.selectedText,
                      ]}
                    >
                      {cuisine}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.inputLabel}>
              Dietary preference
            </Text>

            <View style={styles.wrapOptions}>
              {DIETARY_OPTIONS.map((diet) => {
                const selected =
                  selectedDiet === diet;

                return (
                  <Pressable
                    key={diet}
                    onPress={() =>
                      setSelectedDiet(diet)
                    }
                    style={[
                      styles.optionChip,
                      selected &&
                        styles.optionChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        selected &&
                          styles.selectedText,
                      ]}
                    >
                      {diet}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>
              Ingredients to avoid
            </Text>

            <TextInput
              style={styles.input}
              value={excludedInput}
              onChangeText={setExcludedInput}
              placeholder="Example: peanuts, mushrooms"
              placeholderTextColor={
                COLORS.textLight
              }
            />

            <Text style={styles.inputLabel}>
              Maximum cooking time
            </Text>

            <View style={styles.timeOptions}>
              {COOKING_TIMES.map((time) => {
                const selected =
                  maximumCookingTime === time;

                return (
                  <Pressable
                    key={time}
                    onPress={() =>
                      setMaximumCookingTime(time)
                    }
                    style={[
                      styles.timeButton,
                      selected &&
                        styles.timeButtonSelected,
                    ]}
                  >
                    <Ionicons
                      name="time-outline"
                      size={17}
                      color={
                        selected
                          ? "#FFFFFF"
                          : COLORS.text
                      }
                    />

                    <Text
                      style={[
                        styles.timeButtonText,
                        selected &&
                          styles.selectedText,
                      ]}
                    >
                      {time}m
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.servingsRow}>
              <View>
                <Text style={styles.inputLabel}>
                  Servings
                </Text>

                <Text
                  style={
                    styles.servingsDescription
                  }
                >
                  Select 1–12 servings
                </Text>
              </View>

              <View style={styles.counter}>
                <Pressable
                  onPress={() =>
                    adjustServings(-1)
                  }
                  style={styles.counterButton}
                >
                  <Ionicons
                    name="remove"
                    size={20}
                    color={COLORS.primary}
                  />
                </Pressable>

                <Text style={styles.counterValue}>
                  {servings}
                </Text>

                <Pressable
                  onPress={() =>
                    adjustServings(1)
                  }
                  style={styles.counterButton}
                >
                  <Ionicons
                    name="add"
                    size={20}
                    color={COLORS.primary}
                  />
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={generateRecipe}
              disabled={isGenerating}
              style={[
                styles.generateButton,
                isGenerating &&
                  styles.disabledButton,
              ]}
            >
              {isGenerating ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Ionicons
                  name="sparkles"
                  size={20}
                  color="#FFFFFF"
                />
              )}

              <Text
                style={
                  styles.generateButtonText
                }
              >
                {isGenerating
                  ? "Gemini is cooking..."
                  : "Generate my recipe"}
              </Text>
            </Pressable>
          </View>

          {isGenerating && (
            <View style={styles.loadingCard}>
              <ActivityIndicator
                size="large"
                color={COLORS.primary}
              />

              <Text style={styles.loadingTitle}>
                Creating your recipe
              </Text>

              <Text style={styles.loadingText}>
                Generating the recipe and finding
                a photo of the finished dish.
              </Text>
            </View>
          )}

          {recipe && (
            <RecipeResult recipe={recipe} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
  },
  hero: {
    marginHorizontal: 18,
    marginBottom: 18,
    padding: 24,
    borderRadius: 26,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.18)",
    marginBottom: 18,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "900",
    marginBottom: 8,
  },
  heroText: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 15,
    lineHeight: 22,
  },
  formCard: {
    marginHorizontal: 18,
    padding: 18,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputLabelFirst: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 10,
  },
  inputLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 20,
    marginBottom: 10,
  },
  inputWithIcon: {
    height: 54,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
  },
  iconInput: {
    flex: 1,
    height: "100%",
    color: COLORS.text,
    fontSize: 15,
    outlineStyle: "none",
  },
  input: {
    height: 52,
    paddingHorizontal: 14,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    fontSize: 15,
    outlineStyle: "none",
  },
  largeInput: {
    minHeight: 96,
    padding: 14,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    fontSize: 15,
    outlineStyle: "none",
  },
  helperText: {
    color: COLORS.textLight,
    fontSize: 12,
    marginTop: 7,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  ingredientChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: COLORS.background,
  },
  ingredientChipText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
  },
  horizontalOptions: {
    gap: 8,
    paddingRight: 12,
  },
  wrapOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionChipText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
  },
  selectedText: {
    color: "#FFFFFF",
  },
  timeOptions: {
    flexDirection: "row",
    gap: 8,
  },
  timeButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  timeButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  servingsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  servingsDescription: {
    color: COLORS.textLight,
    fontSize: 12,
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  counterButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  counterValue: {
    minWidth: 34,
    textAlign: "center",
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
  },
  generateButton: {
    minHeight: 56,
    marginTop: 24,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  disabledButton: {
    opacity: 0.65,
  },
  loadingCard: {
    margin: 18,
    padding: 26,
    alignItems: "center",
    borderRadius: 24,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loadingTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 14,
  },
  loadingText: {
    color: COLORS.textLight,
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
  },
  recipeCard: {
    marginHorizontal: 18,
    marginTop: 18,
    backgroundColor: COLORS.card,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  dishPhotoContainer: {
    backgroundColor: COLORS.background,
  },
  dishPhoto: {
    width: "100%",
    height: 260,
  },
  dishPhotoAttribution: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 8,
    backgroundColor: "#FFFFFF",
  },
  dishPhotoCredit: {
    color: COLORS.textLight,
    fontSize: 11,
  },
  attributionLink: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  recipeHero: {
    padding: 22,
  },
  aiBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 14,
  },
  aiBadgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "900",
  },
  recipeTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "900",
  },
  recipeDescription: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  recipeBody: {
    padding: 18,
  },
  recipeMetadata: {
    flexDirection: "row",
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  metadataItem: {
    flex: 1,
    alignItems: "center",
  },
  metadataValue: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 5,
  },
  metadataLabel: {
    color: COLORS.textLight,
    fontSize: 11,
    marginTop: 2,
  },
  labelContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 16,
  },
  dietaryLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "#E8F5E9",
  },
  dietaryLabelText: {
    color: "#2E7D32",
    fontSize: 12,
    fontWeight: "700",
  },
  resultSection: {
    marginTop: 26,
  },
  resultSectionTitle: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "900",
  },
  resultSectionSubtitle: {
    color: COLORS.textLight,
    fontSize: 13,
    marginTop: 3,
    marginBottom: 14,
  },
  ingredientGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  ingredientCard: {
    width: "48%",
    padding: 12,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ingredientImageContainer: {
    height: 110,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
    overflow: "hidden",
  },
  ingredientPhoto: {
    width: "100%",
    height: "100%",
  },
  ingredientImage: {
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  imageFallbackCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imageFallbackText: {
    color: COLORS.textLight,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 5,
  },
  findPhotoButton: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  findPhotoButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  smallAttribution: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  smallAttributionText: {
    color: "#FFFFFF",
    fontSize: 8,
    textAlign: "center",
  },
  ingredientName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  ingredientAmount: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  ingredientPreparation: {
    color: COLORS.textLight,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 3,
  },
  instructionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 16,
  },
  stepCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    marginRight: 12,
  },
  stepNumber: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  instructionText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 21,
  },
  tipBox: {
    marginTop: 26,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#FFF4D9",
    borderWidth: 1,
    borderColor: "#F2D18A",
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 8,
  },
  tipTitle: {
    color: "#7A4900",
    fontSize: 16,
    fontWeight: "800",
  },
  tipText: {
    color: "#7A4900",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  generatedByRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 24,
  },
  generatedByText: {
    color: COLORS.textLight,
    fontSize: 12,
  },
  pexelsProviderLink: {
    alignItems: "center",
    marginTop: 10,
  },
  pexelsProviderText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});

export default AiRecipeScreen;