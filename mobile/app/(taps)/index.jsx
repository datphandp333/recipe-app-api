import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, Modal, Platform, Pressable,
  RefreshControl, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useClerk, useUser } from "@clerk/expo";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { MealAPI } from "../../services/mealAPI";
import {
  COUNTRIES, CURATED_RECIPES, FEATURED_COUNTRIES, searchCountries, searchRecipes,
} from "../../services/recipeCatalog";
import { recipeImageSource } from "../../data/curatedImages";

const C = {
  background: "#FFF8F0", surface: "#FFFFFF", green: "#245B4B", dark: "#173E33",
  coral: "#B94C34", yellow: "#F4C95D", sage: "#DCECE4", cream: "#FFF2D8",
  line: "#E9E1D7", ink: "#20302A", muted: "#65736B",
};
const notice = (title, message) => Platform.OS === "web"
  ? window.alert(`${title}\n\n${message}`) : Alert.alert(title, message);

function DishImage({ recipe, style }) {
  const [failed, setFailed] = useState(false);
  const source = recipeImageSource(recipe);
  useEffect(() => setFailed(false), [recipe.id, recipe.image]);
  if (!source || failed) return (
    <View style={[style, styles.imageFallback]}>
      <Ionicons name="restaurant-outline" size={42} color={C.green} />
    </View>
  );
  return <Image source={source} style={style} contentFit="cover" onError={() => setFailed(true)} accessibilityLabel={recipe.title} />;
}

function RecipeTile({ recipe, saved, saving, onOpen, onSave }) {
  return (
    <View style={styles.tile}>
      <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`View ${recipe.title}`}>
        <DishImage recipe={recipe} style={styles.tileImage} />
        <View style={styles.tileBody}>
          <Text style={styles.countryLabel}>{recipe.country || recipe.area}</Text>
          <Text style={styles.tileTitle} numberOfLines={2}>{recipe.title}</Text>
          <View style={styles.tileMeta}>
            <Ionicons name={recipe.cookTime ? "time-outline" : "book-outline"} size={13} color={C.muted} />
            <Text style={styles.metaText}>{recipe.cookTime || "Explore recipe"}</Text>
          </View>
        </View>
      </Pressable>
      <Pressable
        style={styles.saveButton} onPress={onSave} disabled={saving}
        accessibilityRole="button" accessibilityState={{ disabled: saving, selected: saved }}
        accessibilityLabel={`${saved ? "Remove" : "Save"} ${recipe.title} ${saved ? "from" : "to"} cookbook`}
      >
        {saving ? <ActivityIndicator size="small" color={C.green} /> :
          <Ionicons name={saved ? "heart" : "heart-outline"} size={21} color={saved ? C.coral : C.green} />}
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");
  const [collection, setCollection] = useState({ countryId: "all", recipes: CURATED_RECIPES, source: "curated" });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [savedIds, setSavedIds] = useState([]);
  const [savingIds, setSavingIds] = useState([]);
  const requests = useRef(0);
  const saveRequests = useRef(new Set());
  const currentUser = useRef(user?.id);
  currentUser.current = user?.id;

  const country = COUNTRIES.find((item) => item.id === selectedCountry);
  const availableRecipes = collection.countryId === selectedCountry ? collection.recipes : [];
  const visibleRecipes = useMemo(() => searchRecipes(availableRecipes, query), [availableRecipes, query]);
  const countryResults = useMemo(() => searchCountries(countryQuery), [countryQuery]);
  const suggestions = query.trim() ? searchCountries(query).slice(0, 5) : [];
  const displayName = user?.firstName || user?.username || "Chef";
  const heroRecipe = CURATED_RECIPES[0];
  const showHero = selectedCountry === "all" && !query.trim();

  const loadCollection = useCallback(async (refresh = false) => {
    const requestId = ++requests.current;
    setError("");
    setLoading(true);
    setRefreshing(refresh);
    try {
      const result = await MealAPI.getHomeCollection(selectedCountry, { refresh });
      if (requestId === requests.current) setCollection({ countryId: selectedCountry, ...result });
    } catch (err) {
      if (requestId === requests.current) setError(err.message || "Recipes could not be loaded.");
    } finally {
      if (requestId === requests.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [selectedCountry]);

  useEffect(() => {
    loadCollection();
    return () => { requests.current += 1; };
  }, [loadCollection]);

  useFocusEffect(useCallback(() => {
    let active = true;
    setSavedIds([]);
    if (user?.id) MealAPI.getFavorites(user.id).then((favorites) => {
      if (active) setSavedIds(favorites.map((favorite) => String(favorite.recipeId)));
    }).catch(() => { /* Recipe browsing remains available if the cookbook is offline. */ });
    return () => { active = false; };
  }, [user?.id]));

  const selectCountry = (id) => {
    // Invalidate in-flight work immediately, before the effect for this selection runs.
    if (id !== selectedCountry) requests.current += 1;
    setSelectedCountry(id);
    setError("");
    setQuery("");
    setPickerOpen(false);
  };
  const openRecipe = (recipe) => router.push({ pathname: "/recipe/[id]", params: { id: recipe.id } });
  const openChef = () => router.push({ pathname: "/ai-recipe", params: {
    prompt: country
      ? `I'd like to explore ${country.dish} from ${country.name}. Help me choose a version that works with my ingredients and preferences.`
      : query.trim() ? `I'd like to cook something with ${query.trim()}. Can we explore some options?` : "",
  } });

  const toggleSave = async (recipe) => {
    if (!user?.id) return notice("Sign in required", "Sign in to save recipes to your cookbook.");
    const id = String(recipe.id);
    if (saveRequests.current.has(id)) return;
    const userId = user.id;
    const isSaved = savedIds.includes(id);
    saveRequests.current.add(id);
    setSavingIds((ids) => [...ids, id]);
    try {
      if (isSaved) await MealAPI.removeRecipeFromFavorites(userId, id);
      else await MealAPI.saveRecipeToFavorites({ userId, recipe });
      if (currentUser.current === userId) setSavedIds((ids) => isSaved
        ? ids.filter((savedId) => savedId !== id) : [...new Set([...ids, id])]);
    } catch (err) {
      notice("Could not update cookbook", err.message || "Please try again.");
    } finally {
      saveRequests.current.delete(id);
      setSavingIds((ids) => ids.filter((savedId) => savedId !== id));
    }
  };

  const handleSignOut = () => {
    const perform = async () => {
      try { await signOut(); router.replace("/(auth)/sign-in"); }
      catch { notice("Could not sign out", "Please try again."); }
    };
    if (Platform.OS === "web") {
      if (window.confirm("Sign out of Recipe Chef?")) perform();
    } else Alert.alert("Sign out?", "Your cookbook will be here when you return.", [
      { text: "Cancel", style: "cancel" }, { text: "Sign out", style: "destructive", onPress: perform },
    ]);
  };

  const chipIds = ["all", ...FEATURED_COUNTRIES,
    ...(!FEATURED_COUNTRIES.includes(selectedCountry) && selectedCountry !== "all" ? [selectedCountry] : [])];
  const collectionTitle = query.trim() ? "Find your next favorite" : country
    ? `A taste of ${country.name}` : "Iconic dishes, new favorites";
  const collectionCaption = collection.source === "cache"
    ? "Showing previously loaded recipes. Pull down to try again."
    : collection.source === "mealdb" && country
      ? `More recipes to explore from ${country.name}.`
      : "Home adaptations inspired by kitchens around the world.";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <FlatList
        data={visibleRecipes} numColumns={2} keyExtractor={(item) => String(item.id)}
        style={styles.list} contentContainerStyle={styles.page} columnWrapperStyle={styles.recipeRow}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadCollection(true)} tintColor={C.green} />}
        renderItem={({ item }) => <RecipeTile recipe={item}
          saved={savedIds.includes(String(item.id))} saving={savingIds.includes(String(item.id))}
          onOpen={() => openRecipe(item)} onSave={() => toggleSave(item)} />}
        ListHeaderComponent={<>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.brand}>Recipe<Text style={styles.brandAccent}>Chef</Text></Text>
              <Text style={styles.greeting} numberOfLines={1}>Welcome to your kitchen, {displayName}</Text>
            </View>
            <Pressable style={styles.headerButton} onPress={handleSignOut} accessibilityRole="button" accessibilityLabel="Sign out">
              <Ionicons name="log-out-outline" size={21} color={C.green} />
            </Pressable>
          </View>

          <Text style={styles.slogan}>A world of flavor.{"\n"}<Text style={styles.sloganAccent}>Made in your kitchen.</Text></Text>
          <Text style={styles.subtitle}>Explore iconic dishes, find your next favorite, and make it yours with Recipe Chef.</Text>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={21} color={C.green} />
            <TextInput value={query} onChangeText={setQuery} style={styles.searchInput}
              placeholder="Search dishes, ingredients, countries…" placeholderTextColor={C.muted}
              accessibilityLabel="Search dishes, ingredients, or countries" returnKeyType="search" autoCorrect={false} />
            {!!query && <Pressable onPress={() => setQuery("")} style={styles.clearButton} accessibilityLabel="Clear search" accessibilityRole="button">
              <Ionicons name="close-circle" size={20} color={C.muted} />
            </Pressable>}
          </View>
          {suggestions.length > 0 && <View style={styles.suggestions}>
            <Text style={styles.eyebrow}>EXPLORE A COUNTRY</Text>
            {suggestions.map((item) => <Pressable key={item.id} style={styles.suggestion}
              onPress={() => selectCountry(item.id)} accessibilityRole="button">
              <View style={styles.grow}><Text style={styles.suggestionName}>{item.name}</Text><Text style={styles.smallText}>{item.dish}</Text></View>
              <Ionicons name="arrow-forward" size={17} color={C.green} />
            </Pressable>)}
          </View>}

          {showHero && <Pressable style={styles.hero} onPress={() => openRecipe(heroRecipe)} accessibilityRole="button" accessibilityLabel="View weeknight beef pho">
            <DishImage recipe={heroRecipe} style={styles.heroImage} />
            <LinearGradient colors={["transparent", "rgba(12,38,28,0.45)", "rgba(12,38,28,0.95)"]} style={StyleSheet.absoluteFillObject} />
            <View style={styles.heroTop}><Text style={styles.heroBadge}>A TASTE OF VIETNAM</Text></View>
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>Meet your next{"\n"}comfort bowl.</Text>
              <Text style={styles.heroDescription}>Beef phở · Fragrant broth, rice noodles, fresh herbs.</Text>
              <View style={styles.heroAction}><Text style={styles.heroActionText}>View recipe</Text><Ionicons name="arrow-forward" size={18} color={C.dark} /></View>
            </View>
          </Pressable>}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Explore by country</Text>
            <Pressable onPress={() => { setCountryQuery(""); setPickerOpen(true); }} style={styles.textButton} accessibilityRole="button">
              <Text style={styles.textButtonLabel}>All countries</Text><Ionicons name="arrow-forward" size={16} color={C.green} />
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
            {chipIds.map((id) => <Pressable key={id} onPress={() => selectCountry(id)}
              accessibilityRole="button" accessibilityState={{ selected: selectedCountry === id }}
              style={[styles.chip, selectedCountry === id && styles.activeChip]}>
              <Text style={[styles.chipText, selectedCountry === id && styles.activeChipText]}>
                {id === "all" ? "Around the world" : COUNTRIES.find((item) => item.id === id)?.name}
              </Text>
            </Pressable>)}
          </ScrollView>
          <View style={styles.collectionHeading}>
            <Text style={styles.sectionTitle}>{collectionTitle}</Text>
            <Text style={styles.caption}>{collectionCaption}</Text>
          </View>
          {loading && !refreshing && <View style={styles.loading}><ActivityIndicator color={C.green} /><Text style={styles.smallText}>Finding recipes…</Text></View>}
          {!!error && <View style={styles.errorBox} accessibilityRole="alert">
            <Text style={styles.errorTitle}>We couldn’t load this collection.</Text>
            <Text style={styles.smallText}>{error}</Text>
            <Pressable onPress={() => loadCollection(true)} accessibilityRole="button" style={styles.retry}><Text style={styles.textButtonLabel}>Try again</Text></Pressable>
          </View>}
        </>}
        ListEmptyComponent={!loading && !error ? <View style={styles.empty}>
          <Ionicons name="restaurant-outline" size={32} color={C.green} />
          <Text style={styles.emptyTitle}>{query.trim() ? "Let’s find another idea" : "Let’s explore this together"}</Text>
          <Text style={styles.emptyText}>{country
            ? `We don’t have a complete recipe here yet. Ask Chef about ${country.dish}, or explore another country.`
            : "Try another dish, ingredient, or country. Chef can help you work out what to cook."}</Text>
          <Pressable style={styles.primaryButton} onPress={openChef} accessibilityRole="button"><Text style={styles.primaryButtonText}>Explore with Chef</Text></Pressable>
        </View> : null}
        ListFooterComponent={<>
          <Pressable style={styles.chefCard} onPress={openChef} accessibilityRole="button" accessibilityLabel="Chat with Recipe Chef">
            <View style={styles.chefIcon}><Ionicons name="sparkles" size={22} color={C.green} /></View>
            <View style={styles.grow}><Text style={styles.chefTitle}>Make it yours with Chef.</Text><Text style={styles.chefCopy}>Have ingredients or a craving? Let’s work out dinner together.</Text><Text style={styles.chefLink}>Chat with Chef →</Text></View>
          </Pressable>
          <Text style={styles.footerText}>Good food. A little curiosity. Your kitchen.</Text>
        </>}
      />

      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)} presentationStyle="pageSheet">
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.pickerHeader}>
            <View style={styles.grow}><Text style={styles.sectionTitle}>Where shall we cook?</Text><Text style={styles.caption}>{COUNTRIES.length} countries & territories to explore</Text></View>
            <Pressable style={styles.headerButton} onPress={() => setPickerOpen(false)} accessibilityLabel="Close country picker" accessibilityRole="button"><Ionicons name="close" size={23} color={C.green} /></Pressable>
          </View>
          <View style={[styles.searchBox, styles.pickerSearch]}>
            <Ionicons name="search-outline" size={20} color={C.green} />
            <TextInput autoFocus value={countryQuery} onChangeText={setCountryQuery} style={styles.searchInput}
              placeholder="Find a country or dish…" placeholderTextColor={C.muted} accessibilityLabel="Find a country or dish" autoCorrect={false} />
          </View>
          <FlatList data={countryResults} keyExtractor={(item) => item.id} keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.countryList}
            ListEmptyComponent={<Text style={styles.emptyText}>No matching countries or dishes. Try another name.</Text>}
            renderItem={({ item }) => <Pressable style={styles.countryRow} accessibilityRole="button"
              accessibilityState={{ selected: selectedCountry === item.id }} onPress={() => selectCountry(item.id)}>
              <View style={styles.grow}><Text style={styles.countryName}>{item.name}</Text><Text style={styles.smallText}>{item.dish}</Text></View>
              <Ionicons name={selectedCountry === item.id ? "checkmark-circle" : "chevron-forward"} size={21} color={C.green} />
            </Pressable>} />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.background },
  list: { flex: 1 },
  page: { paddingHorizontal: 20, paddingBottom: 22, width: "100%", maxWidth: 850, alignSelf: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 16, marginBottom: 24, gap: 12 },
  headerCopy: { flex: 1 },
  brand: { fontSize: 21, fontWeight: "800", letterSpacing: -0.8, color: C.ink },
  brandAccent: { color: C.coral },
  greeting: { fontSize: 12, color: C.muted, marginTop: 3 },
  headerButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.line },
  slogan: { fontSize: 34, lineHeight: 40, letterSpacing: -1.3, fontWeight: "700", color: C.ink },
  sloganAccent: { color: C.green },
  subtitle: { color: C.muted, fontSize: 14, lineHeight: 21, marginTop: 12, marginBottom: 20, maxWidth: 520 },
  searchBox: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: C.line, borderRadius: 15, backgroundColor: C.surface, paddingHorizontal: 13, gap: 9, minHeight: 52 },
  searchInput: { flex: 1, minWidth: 0, color: C.ink, fontSize: 14, paddingVertical: 13 },
  clearButton: { minHeight: 44, width: 30, alignItems: "center", justifyContent: "center" },
  suggestions: { backgroundColor: C.surface, padding: 14, borderRadius: 15, marginTop: 10, borderWidth: 1, borderColor: C.line },
  eyebrow: { color: C.coral, fontSize: 10, fontWeight: "800", letterSpacing: 1.3, marginBottom: 4 },
  suggestion: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  suggestionName: { fontSize: 14, fontWeight: "700", color: C.ink },
  grow: { flex: 1 },
  smallText: { fontSize: 12, color: C.muted, lineHeight: 18 },
  hero: { height: 315, marginTop: 23, borderRadius: 23, overflow: "hidden", backgroundColor: C.dark },
  heroImage: { width: "100%", height: "100%", position: "absolute" },
  heroTop: { position: "absolute", top: 18, left: 18 },
  heroBadge: { color: C.dark, backgroundColor: C.yellow, fontSize: 10, fontWeight: "800", letterSpacing: 1, borderRadius: 12, paddingHorizontal: 11, paddingVertical: 7 },
  heroContent: { position: "absolute", bottom: 22, left: 22, right: 22 },
  heroTitle: { color: "#fff", fontSize: 31, lineHeight: 35, fontWeight: "800", letterSpacing: -0.6 },
  heroDescription: { color: "#F3F5EE", fontSize: 12, lineHeight: 18, marginTop: 8, maxWidth: 330 },
  heroAction: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", backgroundColor: C.yellow, borderRadius: 11, paddingHorizontal: 15, paddingVertical: 11, gap: 12, marginTop: 13 },
  heroActionText: { fontSize: 13, fontWeight: "800", color: C.dark },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 24, marginBottom: 8 },
  sectionTitle: { fontSize: 20, fontWeight: "800", letterSpacing: -0.5, color: C.ink, flexShrink: 1 },
  textButton: { flexDirection: "row", alignItems: "center", gap: 5, minHeight: 44 },
  textButtonLabel: { color: C.green, fontSize: 12, fontWeight: "800" },
  chips: { gap: 8, paddingVertical: 4, paddingBottom: 12 },
  chip: { minHeight: 44, justifyContent: "center", backgroundColor: C.surface, paddingHorizontal: 16, borderRadius: 24, borderColor: C.line, borderWidth: 1 },
  activeChip: { backgroundColor: C.green, borderColor: C.green },
  chipText: { color: C.ink, fontSize: 12, fontWeight: "600" },
  activeChipText: { color: "#fff" },
  collectionHeading: { marginTop: 16, marginBottom: 16 },
  caption: { fontSize: 12, color: C.muted, lineHeight: 18, marginTop: 5 },
  recipeRow: { gap: 14 },
  tile: { flex: 1, maxWidth: "49%", backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 18, overflow: "hidden", marginBottom: 16 },
  tileImage: { width: "100%", aspectRatio: 1.28 },
  imageFallback: { alignItems: "center", justifyContent: "center", backgroundColor: C.sage },
  tileBody: { padding: 13 },
  countryLabel: { fontSize: 10, color: C.coral, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 },
  tileTitle: { fontSize: 16, lineHeight: 21, fontWeight: "700", color: C.ink, minHeight: 42 },
  tileMeta: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10 },
  metaText: { fontSize: 11, color: C.muted, flexShrink: 1 },
  saveButton: { position: "absolute", right: 8, top: 8, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.96)", alignItems: "center", justifyContent: "center" },
  loading: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 20 },
  errorBox: { backgroundColor: C.cream, padding: 16, borderRadius: 15, marginBottom: 18 },
  errorTitle: { color: C.ink, fontSize: 14, fontWeight: "700", marginBottom: 5 },
  retry: { minHeight: 44, justifyContent: "center" },
  empty: { backgroundColor: C.cream, alignItems: "center", padding: 24, borderRadius: 18, marginBottom: 16 },
  emptyTitle: { fontSize: 18, color: C.ink, fontWeight: "800", marginTop: 13 },
  emptyText: { color: C.muted, fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 10 },
  primaryButton: { backgroundColor: C.green, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 13, marginTop: 18 },
  primaryButtonText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  chefCard: { backgroundColor: C.sage, borderRadius: 20, padding: 20, flexDirection: "row", alignItems: "flex-start", gap: 14, marginTop: 10 },
  chefIcon: { backgroundColor: C.surface, width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  chefTitle: { color: C.dark, fontSize: 19, fontWeight: "800", letterSpacing: -0.4 },
  chefCopy: { color: C.green, fontSize: 13, lineHeight: 19, marginTop: 6 },
  chefLink: { color: C.dark, fontSize: 13, fontWeight: "800", marginTop: 13 },
  footerText: { textAlign: "center", color: C.muted, fontSize: 11, marginVertical: 23 },
  pickerHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 20 },
  pickerSearch: { marginHorizontal: 20, marginBottom: 10 },
  countryList: { paddingHorizontal: 20, paddingBottom: 30 },
  countryRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 15, borderBottomColor: C.line, borderBottomWidth: 1 },
  countryName: { color: C.ink, fontSize: 16, fontWeight: "700", marginBottom: 4 },
});
