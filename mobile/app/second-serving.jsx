import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { API_URL } from "../constants/api";
import { COLORS } from "../constants/colors";

const readParam = (value) => {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
};

const parseFavoriteParam = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(value);

    return parsed &&
      typeof parsed === "object"
      ? parsed
      : null;
  } catch {
    return null;
  }
};

const getIngredientLabel = (ingredient) => {
  if (typeof ingredient === "string") {
    return ingredient.trim();
  }

  if (
    ingredient &&
    typeof ingredient === "object"
  ) {
    return String(
      ingredient.label ||
        [
          ingredient.amount ||
            ingredient.measure ||
            "",
          ingredient.name || "",
        ]
          .filter(Boolean)
          .join(" ")
    ).trim();
  }

  return "";
};

const getInstructionLabel = (
  instruction
) => {
  if (typeof instruction === "string") {
    return instruction.trim();
  }

  if (
    instruction &&
    typeof instruction === "object"
  ) {
    return String(
      instruction.instruction || ""
    ).trim();
  }

  return "";
};

const createNumericRecipeId = (recipe) => {
  const seed = [
    recipe?.title || "second-serving",
    recipe?.totalTime || "",
    recipe?.servings || "",
    Date.now(),
  ].join("-");

  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash =
      (hash * 31 + seed.charCodeAt(index)) |
      0;
  }

  return (
    Math.abs(hash % 2000000000) ||
    Math.floor(Date.now() / 1000)
  );
};

const getResponseData = async (response) => {
  return response.json().catch(() => null);
};

const showMessage = (
  title,
  message
) => {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
};

const IngredientChips = ({
  items,
  onRemove,
  emptyMessage,
  tone = "green",
}) => {
  if (items.length === 0) {
    return (
      <Text style={styles.emptyChipText}>
        {emptyMessage}
      </Text>
    );
  }

  return (
    <View style={styles.chipList}>
      {items.map((item, index) => (
        <View
          key={`${item}-${index}`}
          style={[
            styles.chip,
            tone === "coral"
              ? styles.coralChip
              : styles.greenChip,
          ]}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.chipText,
              tone === "coral"
                ? styles.coralChipText
                : styles.greenChipText,
            ]}
          >
            {item}
          </Text>

          <TouchableOpacity
            accessibilityLabel={`Remove ${item}`}
            hitSlop={8}
            onPress={() => onRemove(index)}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={
                tone === "coral"
                  ? COLORS.accent
                  : COLORS.primary
              }
            />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

export default function SecondServingScreen() {
  const { user } = useUser();
  const params = useLocalSearchParams();

  const favoriteRecipe = useMemo(
    () =>
      parseFavoriteParam(
        readParam(params.favorite)
      ),
    [params.favorite]
  );

  const initialRecipeTitle = readParam(
    params.title
  );

  const initialIngredients = useMemo(() => {
    if (
      !favoriteRecipe?.ingredients ||
      !Array.isArray(
        favoriteRecipe.ingredients
      )
    ) {
      return [];
    }

    return favoriteRecipe.ingredients
      .map(getIngredientLabel)
      .filter(Boolean)
      .slice(0, 30);
  }, [favoriteRecipe]);

  const initialInstructions = useMemo(() => {
    if (
      !favoriteRecipe?.instructions ||
      !Array.isArray(
        favoriteRecipe.instructions
      )
    ) {
      return [];
    }

    return favoriteRecipe.instructions
      .map(getInstructionLabel)
      .filter(Boolean)
      .slice(0, 20);
  }, [favoriteRecipe]);

  const savedRecipeTitle =
    favoriteRecipe?.title ||
    initialRecipeTitle ||
    "My saved recipe";

  const [leftovers, setLeftovers] = useState([]);
  const [leftoverInput, setLeftoverInput] =
    useState("");

  const [
    useSoonIngredients,
    setUseSoonIngredients,
  ] = useState([]);

  const [
    useSoonInput,
    setUseSoonInput,
  ] = useState("");

  const [tasteNote, setTasteNote] =
    useState(
      favoriteRecipe?.personalNote || ""
    );

  const [servings, setServings] = useState("2");
  const [isGenerating, setIsGenerating] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(false);

  const addItem = (
    value,
    setValue,
    setItems
  ) => {
    const cleanedValue = value.trim();

    if (!cleanedValue) {
      return;
    }

    setItems((currentItems) => {
      const isDuplicate =
        currentItems.some(
          (item) =>
            item.toLowerCase() ===
            cleanedValue.toLowerCase()
        );

      if (isDuplicate) {
        return currentItems;
      }

      return [
        ...currentItems,
        cleanedValue,
      ];
    });

    setValue("");
  };

  const removeItem = (
    index,
    setItems
  ) => {
    setItems((currentItems) =>
      currentItems.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  };

  const handleGenerate = async () => {
    if (
      leftovers.length === 0 &&
      useSoonIngredients.length === 0
    ) {
      setErrorMessage(
        "Add at least one leftover or one ingredient you want to use soon."
      );

      return;
    }

    setErrorMessage("");
    setResult(null);
    setSaved(false);
    setIsGenerating(true);

    try {
      const response = await fetch(
        `${API_URL}/ai/recipes/second-serving`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            favoriteRecipe: {
              title: savedRecipeTitle,
              ingredients:
                initialIngredients,
              instructions:
                initialInstructions,
              personalNote: tasteNote.trim(),
              cookTime:
                favoriteRecipe?.cookTime || "",
              servings:
                favoriteRecipe?.servings || "",
            },

            leftovers,

            useSoonIngredients,

            tasteNote: tasteNote.trim(),

            servings: Math.max(
              1,
              Math.min(
                20,
                Number(servings) || 2
              )
            ),
          }),
        }
      );

      const data =
        await getResponseData(response);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Second Serving could not be created."
        );
      }

      setResult(data);
    } catch (error) {
      setErrorMessage(
        error?.message ||
          "Second Serving could not be created. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToCookbook = async () => {
    const recipe = result?.suggestedRecipe;

    if (!recipe) {
      return;
    }

    if (!user?.id) {
      showMessage(
        "Sign in required",
        "Sign in before saving recipes to your cookbook."
      );

      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/favorites`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            userId: user.id,

            recipeId: createNumericRecipeId(
              recipe
            ),

            title: recipe.title,

            image:
              recipe.image ||
              recipe.imageUrl ||
              null,

            cookTime:
              recipe.totalTime
                ? `${recipe.totalTime} min`
                : null,

            servings: recipe.servings,

            ingredients:
              recipe.ingredients || [],

            instructions:
              recipe.instructions || [],

            personalNote:
              "Created with Second Serving — a leftover rescue recipe.",
          }),
        }
      );

      const data =
        await getResponseData(response);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "The recipe could not be saved."
        );
      }

      setSaved(true);

      showMessage(
        "Saved to My Cookbook",
        `${recipe.title} is ready whenever you want to cook it.`
      );
    } catch (error) {
      showMessage(
        "Unable to save recipe",
        error?.message ||
          "Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const recipe = result?.suggestedRecipe;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel="Go back"
          hitSlop={12}
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={COLORS.primary}
          />
        </TouchableOpacity>

        <View>
          <Text style={styles.headerTitle}>
            Second Serving
          </Text>

          <Text style={styles.headerSubtitle}>
            Turn leftovers into tomorrow’s favorite
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="sparkles"
            size={20}
            color={COLORS.white}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={
          styles.content
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons
              name="restaurant"
              size={31}
              color={COLORS.white}
            />
          </View>

          <Text style={styles.eyebrow}>
            LEFTOVER RESCUE
          </Text>

          <Text style={styles.heroTitle}>
            Give good food a second life.
          </Text>

          <Text style={styles.heroText}>
            Tell Recipe Chef what is left in
            your kitchen. It will create a new
            meal before those ingredients go to
            waste.
          </Text>
        </View>

        <View style={styles.savedRecipeCard}>
          <View style={styles.savedRecipeIcon}>
            <Ionicons
              name="heart"
              size={20}
              color={COLORS.accent}
            />
          </View>

          <View style={styles.savedRecipeContent}>
            <Text style={styles.savedRecipeLabel}>
              STARTING FROM
            </Text>

            <Text
              numberOfLines={2}
              style={styles.savedRecipeTitle}
            >
              {savedRecipeTitle}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            What leftovers do you have?
          </Text>

          <Text style={styles.sectionDescription}>
            Add cooked food, extra portions, or
            ingredients already opened.
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              value={leftoverInput}
              onChangeText={setLeftoverInput}
              onSubmitEditing={() =>
                addItem(
                  leftoverInput,
                  setLeftoverInput,
                  setLeftovers
                )
              }
              placeholder="Example: cooked chicken"
              placeholderTextColor={
                COLORS.textLight
              }
              returnKeyType="done"
              style={styles.textInput}
            />

            <TouchableOpacity
              accessibilityLabel="Add leftover"
              onPress={() =>
                addItem(
                  leftoverInput,
                  setLeftoverInput,
                  setLeftovers
                )
              }
              style={styles.addButton}
            >
              <Ionicons
                name="add"
                size={24}
                color={COLORS.white}
              />
            </TouchableOpacity>
          </View>

          <IngredientChips
            items={leftovers}
            emptyMessage="Nothing added yet."
            onRemove={(index) =>
              removeItem(index, setLeftovers)
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            What should you use soon?
          </Text>

          <Text style={styles.sectionDescription}>
            Add produce or pantry items that
            might expire soon.
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              value={useSoonInput}
              onChangeText={setUseSoonInput}
              onSubmitEditing={() =>
                addItem(
                  useSoonInput,
                  setUseSoonInput,
                  setUseSoonIngredients
                )
              }
              placeholder="Example: spinach or lime"
              placeholderTextColor={
                COLORS.textLight
              }
              returnKeyType="done"
              style={styles.textInput}
            />

            <TouchableOpacity
              accessibilityLabel="Add ingredient"
              onPress={() =>
                addItem(
                  useSoonInput,
                  setUseSoonInput,
                  setUseSoonIngredients
                )
              }
              style={[
                styles.addButton,
                styles.coralAddButton,
              ]}
            >
              <Ionicons
                name="add"
                size={24}
                color={COLORS.white}
              />
            </TouchableOpacity>
          </View>

          <IngredientChips
            items={useSoonIngredients}
            emptyMessage="Nothing added yet."
            tone="coral"
            onRemove={(index) =>
              removeItem(
                index,
                setUseSoonIngredients
              )
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Make it your style
          </Text>

          <TextInput
            value={tasteNote}
            multiline
            maxLength={500}
            onChangeText={setTasteNote}
            placeholder="Example: Make it spicy, less salty, or kid-friendly."
            placeholderTextColor={
              COLORS.textLight
            }
            style={styles.notesInput}
          />

          <View style={styles.servingsRow}>
            <View>
              <Text style={styles.servingsLabel}>
                SERVINGS
              </Text>

              <Text style={styles.servingsText}>
                How many people?
              </Text>
            </View>

            <TextInput
              keyboardType="number-pad"
              maxLength={2}
              onChangeText={setServings}
              value={servings}
              style={styles.servingsInput}
            />
          </View>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Ionicons
              name="alert-circle"
              size={21}
              color={COLORS.accent}
            />

            <Text style={styles.errorText}>
              {errorMessage}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          disabled={isGenerating}
          onPress={handleGenerate}
          style={[
            styles.generateButton,
            isGenerating &&
              styles.disabledButton,
          ]}
        >
          {isGenerating ? (
            <ActivityIndicator
              color={COLORS.white}
            />
          ) : (
            <Ionicons
              name="sparkles"
              size={20}
              color={COLORS.white}
            />
          )}

          <Text style={styles.generateButtonText}>
            {isGenerating
              ? "Recipe Chef is cooking..."
              : "Create My Second Serving"}
          </Text>
        </TouchableOpacity>

        {result ? (
          <View style={styles.resultSection}>
            <View style={styles.resultHeader}>
              <View style={styles.resultIcon}>
                <Ionicons
                  name="sparkles"
                  size={19}
                  color={COLORS.white}
                />
              </View>

              <Text style={styles.resultEyebrow}>
                YOUR SECOND SERVING
              </Text>
            </View>

            <Text style={styles.replyText}>
              {result.reply}
            </Text>

            {result.useFirst?.length ? (
              <View style={styles.useFirstBox}>
                <View style={styles.useFirstTitleRow}>
                  <Ionicons
                    name="leaf"
                    size={19}
                    color={COLORS.primary}
                  />

                  <Text style={styles.useFirstTitle}>
                    Use these first
                  </Text>
                </View>

                {result.useFirst.map(
                  (item, index) => (
                    <Text
                      key={`${item}-${index}`}
                      style={styles.useFirstText}
                    >
                      • {item}
                    </Text>
                  )
                )}
              </View>
            ) : null}

            {recipe ? (
              <View style={styles.recipeCard}>
                <Text style={styles.recipeTitle}>
                  {recipe.title}
                </Text>

                <Text style={styles.recipeDescription}>
                  {recipe.description}
                </Text>

                <View style={styles.recipeFacts}>
                  <View style={styles.recipeFact}>
                    <Ionicons
                      name="time-outline"
                      size={17}
                      color={COLORS.accent}
                    />

                    <Text style={styles.recipeFactText}>
                      {recipe.totalTime || 0} min
                    </Text>
                  </View>

                  <View style={styles.recipeFact}>
                    <Ionicons
                      name="people-outline"
                      size={17}
                      color={COLORS.accent}
                    />

                    <Text style={styles.recipeFactText}>
                      {recipe.servings || 2} servings
                    </Text>
                  </View>
                </View>

                <Text style={styles.recipeSectionTitle}>
                  Ingredients
                </Text>

                {recipe.ingredients?.map(
                  (ingredient, index) => (
                    <Text
                      key={
                        ingredient.id ||
                        `${ingredient.name}-${index}`
                      }
                      style={styles.recipeListItem}
                    >
                      •{" "}
                      {ingredient.label ||
                        [
                          ingredient.amount,
                          ingredient.name,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                    </Text>
                  )
                )}

                <Text style={styles.recipeSectionTitle}>
                  Instructions
                </Text>

                {recipe.instructions?.map(
                  (instruction, index) => (
                    <View
                      key={
                        instruction.step ||
                        index
                      }
                      style={styles.stepRow}
                    >
                      <View style={styles.stepNumber}>
                        <Text
                          style={
                            styles.stepNumberText
                          }
                        >
                          {index + 1}
                        </Text>
                      </View>

                      <Text style={styles.stepText}>
                        {instruction.instruction}
                      </Text>
                    </View>
                  )
                )}

                <TouchableOpacity
                  disabled={isSaving || saved}
                  onPress={handleSaveToCookbook}
                  style={[
                    styles.saveButton,
                    saved &&
                      styles.savedButton,
                    isSaving &&
                      styles.disabledButton,
                  ]}
                >
                  {isSaving ? (
                    <ActivityIndicator
                      color={COLORS.white}
                    />
                  ) : (
                    <Ionicons
                      name={
                        saved
                          ? "checkmark-circle"
                          : "heart"
                      }
                      size={20}
                      color={COLORS.white}
                    />
                  )}

                  <Text style={styles.saveButtonText}>
                    {saved
                      ? "Saved to My Cookbook"
                      : "Save to My Cookbook"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: COLORS.background,
    flex: 1,
  },

  header: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 74,
    paddingHorizontal: 20,
  },

  headerButton: {
    alignItems: "center",
    height: 42,
    justifyContent: "center",
    width: 42,
  },

  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },

  headerSubtitle: {
    color: COLORS.textLight,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
    textAlign: "center",
  },

  headerIcon: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    height: 42,
    justifyContent: "center",
    width: 42,
  },

  content: {
    padding: 20,
    paddingBottom: 56,
  },

  heroCard: {
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.border,
    borderRadius: 28,
    borderWidth: 1,
    padding: 28,
  },

  heroIcon: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },

  eyebrow: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginTop: 18,
  },

  heroTitle: {
    color: COLORS.text,
    fontSize: 27,
    fontWeight: "900",
    marginTop: 8,
    textAlign: "center",
  },

  heroText: {
    color: COLORS.textLight,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 10,
    textAlign: "center",
  },

  savedRecipeCard: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 19,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 18,
    padding: 16,
  },

  savedRecipeIcon: {
    alignItems: "center",
    backgroundColor: COLORS.accentLight,
    borderRadius: 18,
    height: 44,
    justifyContent: "center",
    marginRight: 12,
    width: 44,
  },

  savedRecipeContent: {
    flex: 1,
  },

  savedRecipeLabel: {
    color: COLORS.textLight,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  savedRecipeTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 4,
  },

  section: {
    marginTop: 28,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "900",
  },

  sectionDescription: {
    color: COLORS.textLight,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 5,
  },

  inputRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 13,
  },

  textInput: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderRadius: 15,
    borderWidth: 1,
    color: COLORS.text,
    flex: 1,
    fontSize: 15,
    minHeight: 52,
    paddingHorizontal: 15,
  },

  addButton: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    height: 52,
    justifyContent: "center",
    width: 52,
  },

  coralAddButton: {
    backgroundColor: COLORS.accent,
  },

  chipList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },

  chip: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    maxWidth: "100%",
    paddingHorizontal: 11,
    paddingVertical: 8,
  },

  greenChip: {
    backgroundColor: COLORS.primaryLight,
  },

  coralChip: {
    backgroundColor: COLORS.accentLight,
  },

  chipText: {
    fontSize: 13,
    fontWeight: "800",
    maxWidth: 220,
  },

  greenChipText: {
    color: COLORS.primary,
  },

  coralChipText: {
    color: COLORS.accent,
  },

  emptyChipText: {
    color: COLORS.textLight,
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 12,
  },

  notesInput: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 13,
    minHeight: 106,
    padding: 15,
    textAlignVertical: "top",
  },

  servingsRow: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 13,
    padding: 13,
  },

  servingsLabel: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  servingsText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 3,
  },

  servingsInput: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "900",
    height: 42,
    textAlign: "center",
    width: 58,
  },

  errorBox: {
    alignItems: "center",
    backgroundColor: COLORS.accentLight,
    borderRadius: 15,
    flexDirection: "row",
    gap: 9,
    marginTop: 22,
    padding: 14,
  },

  errorText: {
    color: COLORS.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },

  generateButton: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 17,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginTop: 25,
    minHeight: 57,
    paddingHorizontal: 20,
  },

  disabledButton: {
    opacity: 0.65,
  },

  generateButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
  },

  resultSection: {
    marginTop: 32,
  },

  resultHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
  },

  resultIcon: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    width: 28,
  },

  resultEyebrow: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },

  replyText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
    marginTop: 12,
  },

  useFirstBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 18,
    marginTop: 16,
    padding: 16,
  },

  useFirstTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },

  useFirstTitle: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "900",
  },

  useFirstText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },

  recipeCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 16,
    overflow: "hidden",
    padding: 20,
  },

  recipeTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
  },

  recipeDescription: {
    color: COLORS.textLight,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },

  recipeFacts: {
    flexDirection: "row",
    gap: 18,
    marginTop: 16,
  },

  recipeFact: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },

  recipeFactText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "900",
  },

  recipeSectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 23,
  },

  recipeListItem: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 7,
  },

  stepRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  stepNumber: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    height: 30,
    justifyContent: "center",
    width: 30,
  },

  stepNumberText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "900",
  },

  stepText: {
    color: COLORS.text,
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    paddingTop: 3,
  },

  saveButton: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    flexDirection: "row",
    gap: 9,
    justifyContent: "center",
    marginTop: 27,
    minHeight: 55,
    paddingHorizontal: 18,
  },

  savedButton: {
    backgroundColor: COLORS.primary,
  },

  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
  },
});