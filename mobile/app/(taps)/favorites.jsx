import {
  View,
  Text,
  Alert,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Platform,
} from "react-native";
import {
  useRouter,
  useFocusEffect,
} from "expo-router";
import { useClerk, useUser } from "@clerk/expo";
import { useCallback, useState } from "react";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { API_URL } from "../../constants/api";
import { favoritesStyles } from "../../assets/styles/favorites.styles";
import { COLORS } from "../../constants/colors";
import NoFavoritesFound from "../../components/NoFavoritesFound";
import LoadingSpinner from "../../components/LoadingSpinner";

const FavoritesScreen = () => {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();

  const [favoriteRecipes, setFavoriteRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingFavoriteId, setDeletingFavoriteId] = useState(null);

  const loadFavorites = useCallback(async () => {
    if (!user?.id) {
      setFavoriteRecipes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/favorites/${user.id}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch favorites: ${response.status}`
        );
      }

      const favorites = await response.json();

      setFavoriteRecipes(
        Array.isArray(favorites) ? favorites : []
      );
    } catch (error) {
      console.error("Error loading favorites:", error);

      if (Platform.OS === "web") {
        window.alert("Could not load your saved recipes.");
      } else {
        Alert.alert(
          "Could not load favorites",
          "Please check your connection and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (isLoaded) {
        loadFavorites();
      }
    }, [isLoaded, loadFavorites])
  );

  const handleDeleteFavorite = async (favorite) => {
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

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(
            responseData.message ||
              "Could not delete this saved recipe."
          );
        }

        setFavoriteRecipes((currentFavorites) =>
          currentFavorites.filter(
            (savedRecipe) =>
              Number(savedRecipe.id) !== Number(favorite.id)
          )
        );
      } catch (error) {
        console.error("Error deleting favorite:", error);

        if (Platform.OS === "web") {
          window.alert(
            error.message ||
              "Could not delete this saved recipe."
          );
        } else {
          Alert.alert(
            "Could not delete recipe",
            error.message ||
              "Please try again."
          );
        }
      } finally {
        setDeletingFavoriteId(null);
      }
    };

    const message = `Remove "${favorite.title}" from your favorites?`;

    if (Platform.OS === "web") {
      const confirmed = window.confirm(message);

      if (confirmed) {
        await deleteRecipe();
      }

      return;
    }

    Alert.alert("Delete saved recipe?", message, [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: deleteRecipe,
      },
    ]);
  };

  const handleEditFavorite = (favorite) => {
    router.push({
      pathname: "/favorite-editor",
      params: {
        favoriteId: String(favorite.id),
      },
    });
  };

  const handleSignOut = async () => {
    try {
      if (Platform.OS === "web") {
        const confirmed = window.confirm(
          "Are you sure you want to log out?"
        );

        if (!confirmed) {
          return;
        }

        await signOut();
        router.replace("/(auth)/sign-in");
        return;
      }

      Alert.alert("Log out?", "Are you sure you want to log out?", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log out",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/(auth)/sign-in");
          },
        },
      ]);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const renderFavoriteCard = ({ item }) => {
    const isDeleting = Number(deletingFavoriteId) === Number(item.id);

    return (
      <View
        style={{
          width: "48%",
          marginBottom: 16,
          backgroundColor: COLORS.card,
          borderRadius: 18,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: COLORS.border,
        }}
      >
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={{
              width: "100%",
              height: 130,
              backgroundColor: "#F2F2F2",
            }}
            contentFit="cover"
            transition={250}
          />
        ) : (
          <View
            style={{
              width: "100%",
              height: 130,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#F2F2F2",
            }}
          >
            <Ionicons
              name="restaurant-outline"
              size={42}
              color={COLORS.primary}
            />
          </View>
        )}

        <View style={{ padding: 12 }}>
          <Text
            style={{
              color: COLORS.text,
              fontSize: 16,
              fontWeight: "800",
              minHeight: 42,
            }}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 8,
              gap: 4,
            }}
          >
            <Ionicons
              name="time-outline"
              size={14}
              color={COLORS.textLight}
            />

            <Text
              style={{
                color: COLORS.textLight,
                fontSize: 12,
              }}
              numberOfLines={1}
            >
              {item.cookTime || "Recipe saved"}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => handleEditFavorite(item)}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 6,
              backgroundColor: COLORS.primary,
              borderRadius: 10,
              paddingVertical: 10,
              marginTop: 14,
            }}
          >
            <Ionicons
              name="create-outline"
              size={16}
              color={COLORS.white}
            />

            <Text
              style={{
                color: COLORS.white,
                fontSize: 13,
                fontWeight: "800",
              }}
            >
              Edit recipe
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDeleteFavorite(item)}
            disabled={isDeleting}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 6,
              paddingVertical: 10,
              marginTop: 4,
              borderRadius: 10,
            }}
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color="#D9534F"
            />

            <Text
              style={{
                color: "#D9534F",
                fontSize: 13,
                fontWeight: "800",
              }}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!isLoaded || loading) {
    return (
      <LoadingSpinner message="Loading your saved recipes..." />
    );
  }

  return (
    <View style={favoritesStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={favoritesStyles.header}>
          <View>
            <Text style={favoritesStyles.title}>
              My cookbook
            </Text>

            <Text
              style={{
                color: COLORS.textLight,
                fontSize: 14,
                marginTop: 2,
              }}
            >
              Save recipes and make them your own.
            </Text>
          </View>

          <TouchableOpacity
            style={favoritesStyles.logoutButton}
            onPress={handleSignOut}
            accessibilityLabel="Log out"
          >
            <Ionicons
              name="log-out-outline"
              size={22}
              color={COLORS.text}
            />
          </TouchableOpacity>
        </View>

        <View style={favoritesStyles.recipesSection}>
          <FlatList
            data={favoriteRecipes}
            renderItem={renderFavoriteCard}
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
            columnWrapperStyle={
              favoriteRecipes.length > 1
                ? {
                    justifyContent: "space-between",
                  }
                : undefined
            }
            contentContainerStyle={{
              paddingBottom: 32,
            }}
            scrollEnabled={false}
            ListEmptyComponent={<NoFavoritesFound />}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default FavoritesScreen;