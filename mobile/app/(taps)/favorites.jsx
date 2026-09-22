import {
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  useCallback,
  useState,
} from "react";
import {
  useFocusEffect,
  useRouter,
} from "expo-router";
import {
  useClerk,
  useUser,
} from "@clerk/expo";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { API_URL } from "../../constants/api";
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

const FavoriteImage = ({ image }) => {
  const [showImage, setShowImage] =
    useState(Boolean(image));

  if (!showImage) {
    return (
      <View style={styles.recipeImageFallback}>
        <Ionicons
          name="restaurant-outline"
          size={34}
          color={THEME.primary}
        />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: image }}
      style={styles.recipeImage}
      contentFit="cover"
      transition={200}
      onError={() => setShowImage(false)}
    />
  );
};

const FavoriteCard = ({
  favorite,
  isDeleting,
  onEdit,
  onSecondServing,
  onDelete,
}) => {
  return (
    <View style={styles.recipeCard}>
      <View style={styles.recipeImageContainer}>
        <FavoriteImage image={favorite.image} />

        <View style={styles.savedBadge}>
          <Ionicons
            name="heart"
            size={13}
            color={THEME.coral}
          />

          <Text style={styles.savedBadgeText}>
            Saved
          </Text>
        </View>
      </View>

      <View style={styles.recipeCardContent}>
        <Text
          style={styles.recipeTitle}
          numberOfLines={2}
        >
          {favorite.title}
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
            {favorite.cookTime || "Your recipe"}
          </Text>
        </View>

        {favorite.personalNote ? (
          <View style={styles.notePreview}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={13}
              color={THEME.primary}
            />

            <Text
              style={styles.notePreviewText}
              numberOfLines={1}
            >
              Your note added
            </Text>
          </View>
        ) : (
          <View style={styles.notePreview}>
            <Ionicons
              name="create-outline"
              size={13}
              color={THEME.muted}
            />

            <Text
              style={[
                styles.notePreviewText,
                styles.notePreviewMuted,
              ]}
              numberOfLines={1}
            >
              Make it your own
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.editButton}
          onPress={onEdit}
          activeOpacity={0.85}
        >
          <Ionicons
            name="create-outline"
            size={16}
            color={THEME.white}
          />

          <Text style={styles.editButtonText}>
            Edit recipe
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondServingButton}
          onPress={onSecondServing}
          activeOpacity={0.85}
        >
          <Ionicons
            name="sparkles-outline"
            size={16}
            color={THEME.primary}
          />

          <Text style={styles.secondServingButtonText}>
            Second serving
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
          disabled={isDeleting}
          activeOpacity={0.8}
        >
          <Ionicons
            name="trash-outline"
            size={16}
            color={THEME.danger}
          />

          <Text style={styles.deleteButtonText}>
            {isDeleting ? "Removing..." : "Remove"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const FavoritesScreen = () => {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();

  const [
    favoriteRecipes,
    setFavoriteRecipes,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [
    deletingFavoriteId,
    setDeletingFavoriteId,
  ] = useState(null);

  const loadFavorites = useCallback(
    async ({ showLoader = true } = {}) => {
      if (!user?.id) {
        setFavoriteRecipes([]);
        setLoading(false);
        return;
      }

      try {
        if (showLoader) {
          setLoading(true);
        }

        const response = await fetch(
          `${API_URL}/favorites/${user.id}`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch favorites: ${response.status}`
          );
        }

        const favorites =
          await response.json();

        setFavoriteRecipes(
          Array.isArray(favorites)
            ? favorites
            : []
        );
      } catch (error) {
        console.error(
          "Error loading favorites:",
          error
        );

        if (Platform.OS === "web") {
          window.alert(
            "Could not load your saved recipes."
          );
        } else {
          Alert.alert(
            "Could not load favorites",
            "Please check your connection and try again."
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  useFocusEffect(
    useCallback(() => {
      if (isLoaded) {
        loadFavorites();
      }
    }, [isLoaded, loadFavorites])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFavorites({ showLoader: false });
    setRefreshing(false);
  };

  const handleDeleteFavorite = async (
    favorite
  ) => {
    if (!user?.id || deletingFavoriteId) {
      return;
    }

    const deleteRecipe = async () => {
      try {
        setDeletingFavoriteId(favorite.id);

        const response = await fetch(
          `${API_URL}/favorites/${user.id}/record/${favorite.id}`,
          {
            method: "DELETE",
          }
        );

        const responseData =
          await response.json();

        if (!response.ok) {
          throw new Error(
            responseData.message ||
              "Could not delete this saved recipe."
          );
        }

        setFavoriteRecipes(
          (currentFavorites) =>
            currentFavorites.filter(
              (savedRecipe) =>
                Number(savedRecipe.id) !==
                Number(favorite.id)
            )
        );
      } catch (error) {
        console.error(
          "Error deleting favorite:",
          error
        );

        const message =
          error.message ||
          "Could not delete this saved recipe.";

        if (Platform.OS === "web") {
          window.alert(message);
        } else {
          Alert.alert(
            "Could not remove recipe",
            message
          );
        }
      } finally {
        setDeletingFavoriteId(null);
      }
    };

    const message = `Remove "${favorite.title}" from your cookbook?`;

    if (Platform.OS === "web") {
      const confirmed =
        window.confirm(message);

      if (confirmed) {
        await deleteRecipe();
      }

      return;
    }

    Alert.alert(
      "Remove saved recipe?",
      message,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: deleteRecipe,
        },
      ]
    );
  };

  const handleEditFavorite = (favorite) => {
    router.push({
      pathname: "/favorite-editor",
      params: {
        favoriteId: String(favorite.id),
      },
    });
  };

  const handleSecondServing = (favorite) => {
    router.push({
      pathname: "/second-serving",
      params: {
        title: favorite.title || "My saved recipe",

        favorite: JSON.stringify({
          title:
            favorite.title || "My saved recipe",

          image: favorite.image || null,

          cookTime: favorite.cookTime || "",

          servings: favorite.servings || "",

          ingredients: Array.isArray(
            favorite.ingredients
          )
            ? favorite.ingredients.slice(0, 12)
            : [],

          instructions: [],

          personalNote:
            favorite.personalNote || "",
        }),
      },
    });
  };

  const handleSignOut = async () => {
    const signOutUser = async () => {
      try {
        await signOut();
        router.replace("/(auth)/sign-in");
      } catch (error) {
        console.error(
          "Sign out error:",
          error
        );
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Are you sure you want to log out?"
      );

      if (confirmed) {
        await signOutUser();
      }

      return;
    }

    Alert.alert(
      "Log out?",
      "You can sign back in anytime to access your cookbook.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log out",
          style: "destructive",
          onPress: signOutUser,
        },
      ]
    );
  };

  const renderFavoriteCard = ({ item }) => {
    const isDeleting =
      Number(deletingFavoriteId) ===
      Number(item.id);

    return (
      <FavoriteCard
        favorite={item}
        isDeleting={isDeleting}
        onEdit={() => handleEditFavorite(item)}
        onSecondServing={() =>
          handleSecondServing(item)
        }
        onDelete={() =>
          handleDeleteFavorite(item)
        }
      />
    );
  };

  const renderHeader = () => {
    return (
      <>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              YOUR PERSONAL RECIPE BOX
            </Text>

            <Text style={styles.title}>
              My Cookbook
            </Text>

            <Text style={styles.subtitle}>
              Save recipes, adjust them, and
              cook them your way.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleSignOut}
            activeOpacity={0.8}
            accessibilityLabel="Log out"
          >
            <Ionicons
              name="log-out-outline"
              size={21}
              color={THEME.primary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons
              name="heart"
              size={22}
              color={THEME.coral}
            />
          </View>

          <View style={styles.summaryText}>
            <Text style={styles.summaryTitle}>
              {favoriteRecipes.length === 1
                ? "1 saved recipe"
                : `${favoriteRecipes.length} saved recipes`}
            </Text>

            <Text style={styles.summaryDescription}>
              Your collection is ready whenever
              hunger calls.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.exploreCircle}
            onPress={() => router.push("/search")}
            activeOpacity={0.8}
            accessibilityLabel="Explore recipes"
          >
            <Ionicons
              name="arrow-forward"
              size={19}
              color={THEME.white}
            />
          </TouchableOpacity>
        </View>

        {favoriteRecipes.length > 0 && (
          <View style={styles.listHeader}>
            <View>
              <Text style={styles.listEyebrow}>
                YOUR SAVED DISHES
              </Text>

              <Text style={styles.listTitle}>
                Cook it your way
              </Text>
            </View>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
              activeOpacity={0.8}
              accessibilityLabel="Refresh favorites"
            >
              <Ionicons
                name="refresh-outline"
                size={18}
                color={THEME.primary}
              />
            </TouchableOpacity>
          </View>
        )}
      </>
    );
  };

  const renderEmptyState = () => {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name="heart-outline"
            size={48}
            color={THEME.coral}
          />
        </View>

        <Text style={styles.emptyTitle}>
          Your cookbook is waiting
        </Text>

        <Text style={styles.emptyDescription}>
          Save recipes you love, then personalize
          their ingredients, instructions, and notes.
        </Text>

        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => router.push("/search")}
          activeOpacity={0.88}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={THEME.white}
          />

          <Text style={styles.exploreButtonText}>
            Explore recipes
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!isLoaded || loading) {
    return (
      <LoadingSpinner message="Opening your cookbook..." />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={favoriteRecipes}
        renderItem={renderFavoriteCard}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={
          favoriteRecipes.length > 1
            ? styles.recipeRow
            : undefined
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
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

  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  headerText: {
    flex: 1,
    paddingRight: 14,
  },

  eyebrow: {
    color: THEME.coral,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.05,
    marginBottom: 6,
  },

  title: {
    color: THEME.ink,
    fontSize: 31,
    fontWeight: "800",
    letterSpacing: -0.9,
  },

  subtitle: {
    color: THEME.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },

  logoutButton: {
    alignItems: "center",
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
    borderRadius: 21,
    borderWidth: 1,
    height: 43,
    justifyContent: "center",
    width: 43,
  },

  summaryCard: {
    alignItems: "center",
    backgroundColor: THEME.cream,
    borderColor: "#F0DCA9",
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 30,
    padding: 16,
  },

  summaryIcon: {
    alignItems: "center",
    backgroundColor: THEME.white,
    borderRadius: 20,
    height: 42,
    justifyContent: "center",
    marginRight: 12,
    width: 42,
  },

  summaryText: {
    flex: 1,
  },

  summaryTitle: {
    color: THEME.primaryDark,
    fontSize: 16,
    fontWeight: "800",
  },

  summaryDescription: {
    color: "#6A6F68",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },

  exploreCircle: {
    alignItems: "center",
    backgroundColor: THEME.primary,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    marginLeft: 10,
    width: 36,
  },

  listHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  listEyebrow: {
    color: THEME.coral,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 3,
  },

  listTitle: {
    color: THEME.ink,
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.45,
  },

  refreshButton: {
    alignItems: "center",
    backgroundColor: THEME.sage,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
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
    height: 126,
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

  savedBadge: {
    alignItems: "center",
    backgroundColor: THEME.white,
    borderRadius: 14,
    flexDirection: "row",
    gap: 4,
    left: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
    position: "absolute",
    top: 9,
  },

  savedBadgeText: {
    color: THEME.coralDark,
    fontSize: 10,
    fontWeight: "800",
  },

  recipeCardContent: {
    padding: 12,
  },

  recipeTitle: {
    color: THEME.ink,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
    minHeight: 40,
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

  notePreview: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginTop: 8,
  },

  notePreviewText: {
    color: THEME.primary,
    fontSize: 11,
    fontWeight: "700",
  },

  notePreviewMuted: {
    color: THEME.muted,
  },

  editButton: {
    alignItems: "center",
    backgroundColor: THEME.primary,
    borderRadius: 11,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    marginTop: 13,
    paddingVertical: 10,
  },

  editButtonText: {
    color: THEME.white,
    fontSize: 12,
    fontWeight: "800",
  },

  secondServingButton: {
    alignItems: "center",
    backgroundColor: THEME.sage,
    borderColor: "#BFDCD0",
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    marginTop: 7,
    paddingVertical: 9,
  },

  secondServingButtonText: {
    color: THEME.primary,
    fontSize: 12,
    fontWeight: "800",
  },

  deleteButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    marginTop: 5,
    paddingVertical: 7,
  },

  deleteButtonText: {
    color: THEME.danger,
    fontSize: 12,
    fontWeight: "800",
  },

  emptyState: {
    alignItems: "center",
    backgroundColor: THEME.surface,
    borderColor: THEME.border,
    borderRadius: 26,
    borderStyle: "dashed",
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 42,
  },

  emptyIcon: {
    alignItems: "center",
    backgroundColor: "#FDE5DD",
    borderRadius: 38,
    height: 76,
    justifyContent: "center",
    marginBottom: 19,
    width: 76,
  },

  emptyTitle: {
    color: THEME.ink,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyDescription: {
    color: THEME.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
    textAlign: "center",
  },

  exploreButton: {
    alignItems: "center",
    backgroundColor: THEME.primary,
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    marginTop: 22,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },

  exploreButtonText: {
    color: THEME.white,
    fontSize: 14,
    fontWeight: "800",
  },
});

export default FavoritesScreen;