import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";

import { API_URL } from "../constants/api";
import { COLORS } from "../constants/colors";
import { MealAPI } from "../services/mealAPI";

const ingredientToText = (ingredient) => {
  if (typeof ingredient === "string") {
    return ingredient.trim();
  }

  if (!ingredient || typeof ingredient !== "object") {
    return "";
  }

  const amount =
    ingredient.amount ||
    ingredient.measure ||
    "";

  const name =
    ingredient.name ||
    ingredient.label ||
    "";

  return `${amount} ${name}`.trim();
};

const instructionToText = (instruction) => {
  if (typeof instruction === "string") {
    return instruction.trim();
  }

  if (!instruction || typeof instruction !== "object") {
    return "";
  }

  return (
    instruction.instruction ||
    instruction.text ||
    ""
  ).trim();
};

const listToText = (items, formatter) => {
  if (!Array.isArray(items)) {
    return "";
  }

  return items
    .map(formatter)
    .filter(Boolean)
    .join("\n");
};

const textToList = (text) => {
  return text
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
};

export default function FavoriteEditorScreen() {
  const router = useRouter();
  const { favoriteId } = useLocalSearchParams();
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [ingredientsText, setIngredientsText] = useState("");
  const [instructionsText, setInstructionsText] = useState("");
  const [personalNote, setPersonalNote] = useState("");

  const showMessage = (message) => {
    if (Platform.OS === "web") {
      window.alert(message);
      return;
    }

    Alert.alert("My cookbook", message);
  };

  useEffect(() => {
    const loadSavedRecipe = async () => {
      if (!user?.id || !favoriteId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/favorites/${user.id}/record/${favoriteId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Could not load this saved recipe."
          );
        }

        const favorite = data.favorite;

        let ingredients = Array.isArray(favorite.ingredients)
          ? favorite.ingredients
          : [];

        let instructions = Array.isArray(favorite.instructions)
          ? favorite.instructions
          : [];

        /*
         * Favorites saved before this feature have empty arrays.
         * For those recipes, load the original MealDB recipe once
         * so the user can begin editing it.
         */
        if (
          ingredients.length === 0 ||
          instructions.length === 0
        ) {
          try {
            const mealData = await MealAPI.getMealById(
              favorite.recipeId
            );

            if (mealData) {
              const originalRecipe =
                MealAPI.transformMealData(mealData);

              if (ingredients.length === 0) {
                ingredients = originalRecipe.ingredients || [];
              }

              if (instructions.length === 0) {
                instructions = originalRecipe.instructions || [];
              }
            }
          } catch (error) {
            console.log(
              "Could not load original recipe details:",
              error
            );
          }
        }

        setTitle(favorite.title || "");
        setCookTime(favorite.cookTime || "");
        setServings(favorite.servings || "");

        setIngredientsText(
          listToText(ingredients, ingredientToText)
        );

        setInstructionsText(
          listToText(instructions, instructionToText)
        );

        setPersonalNote(favorite.personalNote || "");
      } catch (error) {
        console.error("Error loading saved recipe:", error);

        showMessage(
          error.message ||
            "Could not load this saved recipe."
        );

        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadSavedRecipe();
  }, [favoriteId, router, user?.id]);

  const handleSave = async () => {
    if (!user?.id || !favoriteId) {
      showMessage("Please sign in again and try one more time.");
      return;
    }

    if (!title.trim()) {
      showMessage("Please enter a recipe title.");
      return;
    }

    const ingredients = textToList(ingredientsText);
    const instructions = textToList(instructionsText);

    if (ingredients.length === 0) {
      showMessage("Please keep at least one ingredient.");
      return;
    }

    if (instructions.length === 0) {
      showMessage("Please keep at least one instruction.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_URL}/favorites/${user.id}/record/${favoriteId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            cookTime: cookTime.trim(),
            servings: servings.trim(),
            ingredients,
            instructions,
            personalNote: personalNote.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not save your changes."
        );
      }

      showMessage(
        "Your personalized recipe has been saved."
      );

      router.back();
    } catch (error) {
      console.error("Error saving favorite:", error);

      showMessage(
        error.message ||
          "Could not save your changes. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.background,
          gap: 12,
        }}
      >
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />

        <Text
          style={{
            color: COLORS.textLight,
            fontSize: 15,
          }}
        >
          Loading your saved recipe...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 48,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: COLORS.card,
              marginRight: 12,
            }}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={COLORS.text}
            />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: COLORS.text,
                fontSize: 25,
                fontWeight: "800",
              }}
            >
              Make it your own
            </Text>

            <Text
              style={{
                color: COLORS.textLight,
                fontSize: 14,
                marginTop: 2,
              }}
            >
              Adjust this saved recipe to your taste.
            </Text>
          </View>
        </View>

        <Text
          style={{
            color: COLORS.text,
            fontSize: 15,
            fontWeight: "800",
            marginBottom: 8,
          }}
        >
          Recipe title
        </Text>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Recipe title"
          placeholderTextColor={COLORS.textLight}
          style={{
            backgroundColor: COLORS.card,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 13,
            color: COLORS.text,
            fontSize: 16,
            marginBottom: 18,
          }}
        />

        <View
          style={{
            flexDirection: "row",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: COLORS.text,
                fontSize: 15,
                fontWeight: "800",
                marginBottom: 8,
              }}
            >
              Cooking time
            </Text>

            <TextInput
              value={cookTime}
              onChangeText={setCookTime}
              placeholder="30 minutes"
              placeholderTextColor={COLORS.textLight}
              style={{
                backgroundColor: COLORS.card,
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 13,
                color: COLORS.text,
                fontSize: 15,
              }}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: COLORS.text,
                fontSize: 15,
                fontWeight: "800",
                marginBottom: 8,
              }}
            >
              Servings
            </Text>

            <TextInput
              value={servings}
              onChangeText={setServings}
              placeholder="4"
              keyboardType="number-pad"
              placeholderTextColor={COLORS.textLight}
              style={{
                backgroundColor: COLORS.card,
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 13,
                color: COLORS.text,
                fontSize: 15,
              }}
            />
          </View>
        </View>

        <Text
          style={{
            color: COLORS.text,
            fontSize: 18,
            fontWeight: "800",
            marginTop: 6,
            marginBottom: 6,
          }}
        >
          Ingredients
        </Text>

        <Text
          style={{
            color: COLORS.textLight,
            fontSize: 13,
            marginBottom: 8,
          }}
        >
          Put one ingredient on each line.
        </Text>

        <TextInput
          value={ingredientsText}
          onChangeText={setIngredientsText}
          multiline
          textAlignVertical="top"
          placeholder={"2 chicken breasts\n1 tablespoon chili flakes"}
          placeholderTextColor={COLORS.textLight}
          style={{
            minHeight: 170,
            backgroundColor: COLORS.card,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 14,
            color: COLORS.text,
            fontSize: 15,
            lineHeight: 23,
            marginBottom: 22,
          }}
        />

        <Text
          style={{
            color: COLORS.text,
            fontSize: 18,
            fontWeight: "800",
            marginBottom: 6,
          }}
        >
          Instructions
        </Text>

        <Text
          style={{
            color: COLORS.textLight,
            fontSize: 13,
            marginBottom: 8,
          }}
        >
          Put one cooking step on each line.
        </Text>

        <TextInput
          value={instructionsText}
          onChangeText={setInstructionsText}
          multiline
          textAlignVertical="top"
          placeholder={
            "Heat the oil in a large pan.\nAdd more chili flakes for extra spice."
          }
          placeholderTextColor={COLORS.textLight}
          style={{
            minHeight: 230,
            backgroundColor: COLORS.card,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 14,
            color: COLORS.text,
            fontSize: 15,
            lineHeight: 23,
            marginBottom: 22,
          }}
        />

        <Text
          style={{
            color: COLORS.text,
            fontSize: 18,
            fontWeight: "800",
            marginBottom: 6,
          }}
        >
          My notes
        </Text>

        <Text
          style={{
            color: COLORS.textLight,
            fontSize: 13,
            marginBottom: 8,
          }}
        >
          Optional: write your personal taste changes here.
        </Text>

        <TextInput
          value={personalNote}
          onChangeText={setPersonalNote}
          multiline
          textAlignVertical="top"
          placeholder="Example: Add extra chili flakes and use half the sugar."
          placeholderTextColor={COLORS.textLight}
          style={{
            minHeight: 120,
            backgroundColor: COLORS.card,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 14,
            color: COLORS.text,
            fontSize: 15,
            lineHeight: 23,
            marginBottom: 26,
          }}
        />

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
          style={{
            minHeight: 54,
            borderRadius: 14,
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "row",
            gap: 8,
            backgroundColor: saving
              ? COLORS.textLight
              : COLORS.primary,
          }}
        >
          <Ionicons
            name={saving ? "hourglass-outline" : "save-outline"}
            size={20}
            color={COLORS.white}
          />

          <Text
            style={{
              color: COLORS.white,
              fontSize: 16,
              fontWeight: "800",
            }}
          >
            {saving ? "Saving changes..." : "Save my version"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}