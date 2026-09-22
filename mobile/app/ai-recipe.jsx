import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { MealAPI } from "../services/mealAPI";

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
  success: "#2E7D5B",
};

const QUICK_PROMPTS = [
  "I have chicken, rice, and cilantro. What can I make?",
  "How can I make this dish more spicy?",
  "Give me an easy high-protein dinner.",
  "What can I substitute for eggs?",
];

const RecipeImage = ({ imageUrl }) => {
  const [showImage, setShowImage] =
    useState(Boolean(imageUrl));

  if (!showImage) {
    return (
      <View style={styles.recipeImageFallback}>
        <View style={styles.recipeFallbackIcon}>
          <Ionicons
            name="restaurant-outline"
            size={38}
            color={THEME.primary}
          />
        </View>

        <Text style={styles.recipeFallbackText}>
          Your personalized dish
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={styles.recipeImage}
      contentFit="cover"
      transition={250}
      onError={() => setShowImage(false)}
    />
  );
};

const RecipeCard = ({
  recipe,
  onSave,
  isSaving,
  isSaved,
}) => {
  if (!recipe) {
    return null;
  }

  const imageUrl =
    recipe.dishPhoto?.imageUrl ||
    recipe.image ||
    null;

  const ingredients = Array.isArray(
    recipe.ingredients
  )
    ? recipe.ingredients
    : [];

  const instructions = Array.isArray(
    recipe.instructions
  )
    ? recipe.instructions
    : [];

  return (
    <View style={styles.recipeCard}>
      <View style={styles.recipeImageWrapper}>
        <RecipeImage imageUrl={imageUrl} />

        <View style={styles.recipeImageOverlay} />

        <View style={styles.recipeBadge}>
          <Ionicons
            name="sparkles"
            size={13}
            color={THEME.primaryDark}
          />

          <Text style={styles.recipeBadgeText}>
            Recipe Chef creation
          </Text>
        </View>
      </View>

      <View style={styles.recipeContent}>
        <Text style={styles.recipeTitle}>
          {recipe.title}
        </Text>

        {!!recipe.description && (
          <Text style={styles.recipeDescription}>
            {recipe.description}
          </Text>
        )}

        <View style={styles.recipeStats}>
          <View style={styles.recipeStat}>
            <Ionicons
              name="time-outline"
              size={16}
              color={THEME.coral}
            />

            <Text style={styles.recipeStatText}>
              {recipe.totalTime ||
                recipe.cookTime ||
                30}{" "}
              min
            </Text>
          </View>

          <View style={styles.recipeStat}>
            <Ionicons
              name="people-outline"
              size={16}
              color={THEME.coral}
            />

            <Text style={styles.recipeStatText}>
              {recipe.servings || 4} servings
            </Text>
          </View>

          {!!recipe.difficulty && (
            <View style={styles.recipeStat}>
              <Ionicons
                name="leaf-outline"
                size={16}
                color={THEME.coral}
              />

              <Text style={styles.recipeStatText}>
                {recipe.difficulty}
              </Text>
            </View>
          )}
        </View>

        {ingredients.length > 0 && (
          <View style={styles.recipeSection}>
            <View style={styles.sectionHeading}>
              <View style={styles.sectionIcon}>
                <Ionicons
                  name="basket-outline"
                  size={17}
                  color={THEME.primary}
                />
              </View>

              <Text style={styles.sectionTitle}>
                Ingredients
              </Text>
            </View>

            <View style={styles.ingredientList}>
              {ingredients.map(
                (ingredient, index) => (
                  <View
                    key={
                      ingredient.id ||
                      `${ingredient.name}-${index}`
                    }
                    style={styles.ingredientRow}
                  >
                    <View
                      style={
                        styles.ingredientBullet
                      }
                    />

                    <Text
                      style={styles.ingredientText}
                    >
                      {ingredient.label ||
                        [
                          ingredient.amount,
                          ingredient.name,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                    </Text>
                  </View>
                )
              )}
            </View>
          </View>
        )}

        {instructions.length > 0 && (
          <View style={styles.recipeSection}>
            <View style={styles.sectionHeading}>
              <View style={styles.sectionIcon}>
                <Ionicons
                  name="list-outline"
                  size={17}
                  color={THEME.primary}
                />
              </View>

              <Text style={styles.sectionTitle}>
                Directions
              </Text>
            </View>

            <View style={styles.instructionList}>
              {instructions.map(
                (item, index) => (
                  <View
                    key={`step-${index}`}
                    style={styles.stepRow}
                  >
                    <View style={styles.stepNumber}>
                      <Text
                        style={
                          styles.stepNumberText
                        }
                      >
                        {item.step || index + 1}
                      </Text>
                    </View>

                    <Text style={styles.stepText}>
                      {typeof item === "string"
                        ? item
                        : item.instruction}
                    </Text>
                  </View>
                )
              )}
            </View>
          </View>
        )}

        <Pressable
          onPress={onSave}
          disabled={isSaving || isSaved}
          style={[
            styles.saveButton,
            isSaved && styles.savedButton,
          ]}
        >
          {isSaving ? (
            <ActivityIndicator
              color={THEME.white}
            />
          ) : (
            <>
              <Ionicons
                name={
                  isSaved
                    ? "checkmark-circle"
                    : "heart"
                }
                size={19}
                color={THEME.white}
              />

              <Text style={styles.saveButtonText}>
                {isSaved
                  ? "Saved to My Cookbook"
                  : "Save to My Cookbook"}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
};

export default function AiRecipeScreen() {
  const { user, isLoaded } = useUser();

  const scrollViewRef = useRef(null);

  const [message, setMessage] = useState("");
  const [isSending, setIsSending] =
    useState(false);

  const [
    isSavingRecipeId,
    setIsSavingRecipeId,
  ] = useState(null);

  const [
    savedRecipeIds,
    setSavedRecipeIds,
  ] = useState([]);

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I’m Recipe Chef. Tell me what you have in your kitchen, what you want to cook, or ask me any cooking question.",
      recipe: null,
    },
  ]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({
        animated: true,
      });
    }, 180);
  };

  const sendMessage = async (
    presetMessage = ""
  ) => {
    const text = (
      presetMessage || message
    ).trim();

    if (!text || isSending) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      recipe: null,
    };

    const updatedMessages = [
      ...messages,
      userMessage,
    ];

    setMessages(updatedMessages);
    setMessage("");
    setIsSending(true);
    scrollToBottom();

    try {
      const result =
        await MealAPI.chatWithRecipeChef(
          updatedMessages.map((item) => ({
            role: item.role,
            content: item.content,
          }))
        );

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `chef-${Date.now()}`,
          role: "assistant",
          content: result.reply,
          recipe: result.suggestedRecipe,
        },
      ]);

      scrollToBottom();
    } catch (error) {
      Alert.alert(
        "Recipe Chef is unavailable",
        error.message ||
          "Please check that your backend is running, then try again."
      );
    } finally {
      setIsSending(false);
    }
  };

  const saveRecipe = async (recipe) => {
    if (!isLoaded || !user?.id) {
      Alert.alert(
        "Sign in required",
        "Please sign in before saving a recipe."
      );
      return;
    }

    if (!recipe?.id) {
      return;
    }

    if (savedRecipeIds.includes(recipe.id)) {
      return;
    }

    setIsSavingRecipeId(recipe.id);

    try {
      await MealAPI.saveRecipeToFavorites({
        userId: user.id,
        recipe,
      });

      setSavedRecipeIds((currentIds) => [
        ...currentIds,
        recipe.id,
      ]);

      Alert.alert(
        "Saved to My Cookbook",
        "You can edit the ingredients, directions, and notes anytime."
      );
    } catch (error) {
      Alert.alert(
        "Could not save recipe",
        error.message ||
          "Please try again."
      );
    } finally {
      setIsSavingRecipeId(null);
    }
  };

  const startNewConversation = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Fresh start! What would you like to cook today?",
        recipe: null,
      },
    ]);

    setSavedRecipeIds([]);
    setMessage("");

    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: 0,
        animated: true,
      });
    }, 100);
  };

  const showQuickPrompts = messages.length <= 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.headerButton}
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={THEME.primary}
            />
          </Pressable>

          <View style={styles.headerCenter}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerChefIcon}>
                <Ionicons
                  name="restaurant"
                  size={15}
                  color={THEME.white}
                />
              </View>

              <Text style={styles.headerTitle}>
                Recipe Chef
              </Text>
            </View>

            <Text style={styles.headerSubtitle}>
              Your kitchen conversation partner
            </Text>
          </View>

          <Pressable
            onPress={startNewConversation}
            style={styles.headerButton}
            accessibilityLabel="Start a new conversation"
          >
            <Ionicons
              name="refresh-outline"
              size={22}
              color={THEME.primary}
            />
          </Pressable>
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.heroDecorOne} />
            <View style={styles.heroDecorTwo} />

            <View style={styles.heroIcon}>
              <Ionicons
                name="sparkles"
                size={26}
                color={THEME.white}
              />
            </View>

            <Text style={styles.heroEyebrow}>
              YOUR COOKING SIDEKICK
            </Text>

            <Text style={styles.heroTitle}>
              Let’s make dinner easier
            </Text>

            <Text style={styles.heroText}>
              Ask questions, swap ingredients, and
              create a final recipe only when you
              are ready.
            </Text>
          </View>

          {messages.map((chatMessage) => {
            const isUser =
              chatMessage.role === "user";

            return (
              <View
                key={chatMessage.id}
                style={[
                  styles.messageWrap,
                  isUser
                    ? styles.userWrap
                    : styles.chefWrap,
                ]}
              >
                {!isUser && (
                  <View style={styles.chefAvatar}>
                    <Ionicons
                      name="restaurant"
                      size={17}
                      color={THEME.white}
                    />
                  </View>
                )}

                <View
                  style={[
                    styles.messageBubble,
                    isUser
                      ? styles.userBubble
                      : styles.chefBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isUser
                        ? styles.userText
                        : styles.chefText,
                    ]}
                  >
                    {chatMessage.content}
                  </Text>
                </View>

                {!!chatMessage.recipe && (
                  <RecipeCard
                    recipe={chatMessage.recipe}
                    onSave={() =>
                      saveRecipe(
                        chatMessage.recipe
                      )
                    }
                    isSaving={
                      isSavingRecipeId ===
                      chatMessage.recipe.id
                    }
                    isSaved={savedRecipeIds.includes(
                      chatMessage.recipe.id
                    )}
                  />
                )}
              </View>
            );
          })}

          {isSending && (
            <View style={styles.typingWrap}>
              <View style={styles.chefAvatar}>
                <Ionicons
                  name="restaurant"
                  size={17}
                  color={THEME.white}
                />
              </View>

              <View style={styles.typingBubble}>
                <ActivityIndicator
                  size="small"
                  color={THEME.primary}
                />

                <Text style={styles.typingText}>
                  Recipe Chef is thinking...
                </Text>
              </View>
            </View>
          )}

          {showQuickPrompts && (
            <View style={styles.promptArea}>
              <Text style={styles.promptEyebrow}>
                NOT SURE WHERE TO START?
              </Text>

              <Text style={styles.promptTitle}>
                Try one of these
              </Text>

              <View style={styles.promptList}>
                {QUICK_PROMPTS.map((prompt) => (
                  <Pressable
                    key={prompt}
                    onPress={() =>
                      sendMessage(prompt)
                    }
                    style={styles.promptChip}
                  >
                    <Ionicons
                      name="arrow-up-outline"
                      size={15}
                      color={THEME.primary}
                    />

                    <Text style={styles.promptText}>
                      {prompt}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.composer}>
          <View style={styles.inputContainer}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Ask Recipe Chef anything..."
              placeholderTextColor={THEME.softText}
              multiline
              style={styles.input}
              onSubmitEditing={() => sendMessage()}
            />
          </View>

          <Pressable
            onPress={() => sendMessage()}
            disabled={
              !message.trim() || isSending
            }
            style={[
              styles.sendButton,
              (!message.trim() || isSending) &&
                styles.sendButtonDisabled,
            ]}
            accessibilityLabel="Send message"
          >
            <Ionicons
              name="arrow-up"
              size={23}
              color={THEME.white}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    backgroundColor: THEME.background,
  },

  header: {
    alignItems: "center",
    backgroundColor: THEME.background,
    borderBottomColor: THEME.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 11,
  },

  headerButton: {
    alignItems: "center",
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },

  headerCenter: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 10,
  },

  headerTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },

  headerChefIcon: {
    alignItems: "center",
    backgroundColor: THEME.primary,
    borderRadius: 11,
    height: 22,
    justifyContent: "center",
    width: 22,
  },

  headerTitle: {
    color: THEME.ink,
    fontSize: 17,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: THEME.muted,
    fontSize: 11,
    marginTop: 2,
  },

  chatContent: {
    padding: 16,
    paddingBottom: 26,
  },

  hero: {
    alignItems: "center",
    backgroundColor: THEME.cream,
    borderColor: "#F0DCA9",
    borderRadius: 25,
    borderWidth: 1,
    marginBottom: 23,
    overflow: "hidden",
    padding: 22,
  },

  heroDecorOne: {
    backgroundColor: THEME.saffron,
    borderRadius: 45,
    height: 90,
    opacity: 0.3,
    position: "absolute",
    right: -28,
    top: -34,
    width: 90,
  },

  heroDecorTwo: {
    backgroundColor: THEME.coral,
    borderRadius: 24,
    bottom: -18,
    height: 48,
    left: 45,
    opacity: 0.14,
    position: "absolute",
    width: 48,
  },

  heroIcon: {
    alignItems: "center",
    backgroundColor: THEME.primary,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },

  heroEyebrow: {
    color: THEME.coralDark,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 13,
  },

  heroTitle: {
    color: THEME.primaryDark,
    fontSize: 23,
    fontWeight: "800",
    letterSpacing: -0.55,
    marginTop: 6,
  },

  heroText: {
    color: "#626860",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 7,
    textAlign: "center",
  },

  messageWrap: {
    marginBottom: 17,
  },

  userWrap: {
    alignItems: "flex-end",
  },

  chefWrap: {
    alignItems: "flex-start",
  },

  chefAvatar: {
    alignItems: "center",
    backgroundColor: THEME.primary,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    marginBottom: 6,
    width: 36,
  },

  messageBubble: {
    borderRadius: 20,
    maxWidth: "88%",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },

  userBubble: {
    backgroundColor: THEME.primary,
    borderBottomRightRadius: 5,
  },

  chefBubble: {
    backgroundColor: THEME.surface,
    borderBottomLeftRadius: 5,
    borderColor: THEME.border,
    borderWidth: 1,
  },

  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },

  userText: {
    color: THEME.white,
  },

  chefText: {
    color: THEME.ink,
  },

  typingWrap: {
    alignItems: "flex-start",
    marginBottom: 17,
  },

  typingBubble: {
    alignItems: "center",
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },

  typingText: {
    color: THEME.muted,
    fontSize: 13,
    fontWeight: "600",
  },

  promptArea: {
    marginTop: 3,
  },

  promptEyebrow: {
    color: THEME.coral,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },

  promptTitle: {
    color: THEME.ink,
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 12,
    marginTop: 4,
  },

  promptList: {
    gap: 9,
  },

  promptChip: {
    alignItems: "center",
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    padding: 13,
  },

  promptText: {
    color: THEME.primary,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },

  composer: {
    alignItems: "flex-end",
    backgroundColor: THEME.surface,
    borderTopColor: THEME.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },

  inputContainer: {
    backgroundColor: "#FDFBF7",
    borderColor: THEME.border,
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
  },

  input: {
    color: THEME.ink,
    fontSize: 15,
    maxHeight: 112,
    minHeight: 46,
    paddingHorizontal: 15,
    paddingTop: 12,
  },

  sendButton: {
    alignItems: "center",
    backgroundColor: THEME.primary,
    borderRadius: 23,
    height: 46,
    justifyContent: "center",
    width: 46,
  },

  sendButtonDisabled: {
    backgroundColor: "#A8C0B6",
  },

  recipeCard: {
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 13,
    overflow: "hidden",
    width: "100%",
  },

  recipeImageWrapper: {
    height: 190,
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
  },

  recipeFallbackIcon: {
    alignItems: "center",
    backgroundColor: THEME.white,
    borderRadius: 27,
    height: 54,
    justifyContent: "center",
    width: 54,
  },

  recipeFallbackText: {
    color: THEME.primary,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 10,
  },

  recipeImageOverlay: {
    backgroundColor: "rgba(20, 53, 43, 0.18)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },

  recipeBadge: {
    alignItems: "center",
    backgroundColor: THEME.saffron,
    borderRadius: 16,
    flexDirection: "row",
    gap: 5,
    left: 13,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: "absolute",
    top: 13,
  },

  recipeBadgeText: {
    color: THEME.primaryDark,
    fontSize: 11,
    fontWeight: "800",
  },

  recipeContent: {
    padding: 17,
  },

  recipeTitle: {
    color: THEME.ink,
    fontSize: 23,
    fontWeight: "800",
    letterSpacing: -0.6,
    lineHeight: 29,
  },

  recipeDescription: {
    color: THEME.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },

  recipeStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 11,
    marginTop: 14,
  },

  recipeStat: {
    alignItems: "center",
    backgroundColor: "#FFF6E7",
    borderRadius: 14,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },

  recipeStatText: {
    color: THEME.primaryDark,
    fontSize: 12,
    fontWeight: "800",
  },

  recipeSection: {
    marginTop: 22,
  },

  sectionHeading: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },

  sectionIcon: {
    alignItems: "center",
    backgroundColor: THEME.sage,
    borderRadius: 13,
    height: 27,
    justifyContent: "center",
    width: 27,
  },

  sectionTitle: {
    color: THEME.ink,
    fontSize: 17,
    fontWeight: "800",
  },

  ingredientList: {
    gap: 7,
  },

  ingredientRow: {
    flexDirection: "row",
    paddingLeft: 3,
  },

  ingredientBullet: {
    backgroundColor: THEME.coral,
    borderRadius: 4,
    height: 7,
    marginRight: 9,
    marginTop: 7,
    width: 7,
  },

  ingredientText: {
    color: THEME.ink,
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },

  instructionList: {
    gap: 10,
  },

  stepRow: {
    backgroundColor: "#FCFBF8",
    borderColor: THEME.border,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 11,
  },

  stepNumber: {
    alignItems: "center",
    backgroundColor: THEME.primary,
    borderRadius: 15,
    height: 30,
    justifyContent: "center",
    width: 30,
  },

  stepNumberText: {
    color: THEME.white,
    fontSize: 13,
    fontWeight: "800",
  },

  stepText: {
    color: THEME.ink,
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    paddingTop: 3,
  },

  saveButton: {
    alignItems: "center",
    backgroundColor: THEME.primary,
    borderRadius: 15,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 23,
    minHeight: 50,
    paddingHorizontal: 15,
  },

  savedButton: {
    backgroundColor: THEME.success,
  },

  saveButtonText: {
    color: THEME.white,
    fontSize: 15,
    fontWeight: "800",
  },
});