import { betaFetch } from "../../services/betaRequest";
import PageEntrance from "../../components/motion/PageEntrance";
import Pressable from "../../components/motion/MotionPressable";
import { EDITORIAL_COLORS as E, EDITORIAL_FONT as editorialFont } from "../../constants/editorialTheme";
import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../../constants/api";
import { recipeImageSource } from "../../data/curatedImages";
import { cookbookList } from "../../services/kitchenLists";

const C = { ...E, cream: E.background, border: E.line };
function DishPhoto({ recipe }) {
  const source = recipeImageSource({ recipeId: recipe.recipeId, image: recipe.image });
  const imageKey = `${recipe.recipeId}:${recipe.image || ""}`;
  const [failedKey, setFailedKey] = useState(null);
  return source && failedKey !== imageKey ? <Image source={source} style={s.photo} contentFit="cover" onError={() => setFailedKey(imageKey)} accessibilityLabel={recipe.title} />
    : <View style={[s.photo, s.photoFallback]}><Ionicons name="restaurant-outline" size={38} color={C.green} /></View>;
}
function FavoritesScreen() {
  const { user, isLoaded } = useUser();
  if (!isLoaded) return <View style={s.center}><ActivityIndicator color={C.green} /></View>;
  if (!user) return <View style={s.center}><Text style={s.body}>Sign in to open your cookbook.</Text></View>;
  return <Cookbook key={user.id} userId={user.id} />;
}
function Cookbook({ userId }) {
  const router = useRouter();
  const [recipes, setRecipes] = useState([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const revision = useRef(0);
  const mutation = useRef(false);
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; revision.current += 1; }; }, []);
  const request = useCallback(async (path, options = {}) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await betaFetch(`${API_URL}/favorites/${encodeURIComponent(userId)}${path}`, { ...options, signal: controller.signal });
      const data = response.status === 204 ? null : await response.json();
      if (!response.ok) throw new Error(data?.message || "Your cookbook could not be updated.");
      return data;
    } catch (failure) {
      if (failure.name === "AbortError") throw new Error("The request timed out. Please try again.");
      throw failure;
    } finally { clearTimeout(timeout); }
  }, [userId]);
  const load = useCallback(async () => {
    if (mutation.current) return;
    const current = ++revision.current;
    setLoading(true); setError("");
    try {
      const data = await request("");
      if (!Array.isArray(data)) throw new Error("Your cookbook could not be loaded.");
      if (current === revision.current) setRecipes(data);
    } catch (failure) { if (current === revision.current) setError(failure.message); }
    finally { if (current === revision.current) setLoading(false); }
  }, [request]);
  useFocusEffect(useCallback(() => { load(); return () => { revision.current += 1; }; }, [load]));
  const remove = async () => {
    if (!selected || mutation.current) return;
    const recipe = selected;
    mutation.current = true; revision.current += 1; setBusy(true); setLoading(false); setError("");
    try {
      await request(`/${encodeURIComponent(recipe.recipeId)}`, { method: "DELETE" });
      if (!active.current) return;
      setRecipes(previous => previous.filter(item => String(item.id) !== String(recipe.id)));
      setSelected(null); setConfirm(false); setNotice(`${recipe.title} removed from your cookbook.`);
    } catch (failure) { if (active.current) setError(failure.message); }
    finally { mutation.current = false; if (active.current) setBusy(false); }
  };
  const openRecipe = recipe => router.push({ pathname: "/favorite-editor", params: { favoriteId: String(recipe.id) } });
  const secondServing = recipe => {
    setSelected(null);
    router.push({ pathname: "/second-serving", params: { title: recipe.title || "My saved recipe", favorite: JSON.stringify({
      title: recipe.title, image: recipe.image || null, cookTime: recipe.cookTime || "", servings: recipe.servings || "",
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.slice(0, 12) : [], instructions: [], personalNote: recipe.personalNote || "",
    }) } });
  };
  const visible = cookbookList(recipes, query, sort);
  return <SafeAreaView style={s.page} edges={["top", "left", "right"]}>
    <FlatList data={visible} keyExtractor={item => String(item.id)}
      contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={C.green} enabled={!busy} />}
      ListHeaderComponent={<>
        <View style={s.header}><View style={s.grow}><Text style={s.eyebrow}>YOUR PERSONAL COLLECTION</Text><Text style={s.title}>Your cookbook.{"\n"}Made yours.</Text></View><View style={s.heart}><Ionicons name="heart-outline" size={28} color={C.coral} /></View></View>
        <Text style={s.body}>A personal cookbook for dishes worth making again.</Text>
        <View style={s.banner}><View style={s.grow}><Text style={s.bannerTitle}>My cookbook</Text><Text style={s.body}>{loading && !recipes.length ? "Opening your collection…" : `${recipes.length} saved recipe${recipes.length === 1 ? "" : "s"}`}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Discover recipes" style={s.discover} onPress={() => router.push("/(taps)")}><Ionicons name="add" size={18} color={C.green} /><Text style={s.link}>Discover</Text></Pressable></View>
        <View style={s.search}><Ionicons name="search-outline" size={20} color={C.green} /><TextInput accessibilityLabel="Search cookbook" placeholder="Search recipes, ingredients, notes…" placeholderTextColor={C.muted} value={query} onChangeText={setQuery} style={s.input} />{!!query && <Pressable accessibilityRole="button" accessibilityLabel="Clear cookbook search" onPress={() => setQuery("")} style={s.iconButton}><Ionicons name="close" size={18} color={C.green} /></Pressable>}</View>
        <View style={s.toolbar}><View style={s.sortOptions}>{[["recent", "Newest saved"], ["az", "A–Z"]].map(([id, label]) => <Pressable key={id} accessibilityRole="button" accessibilityState={{ selected: sort === id }} onPress={() => setSort(id)} style={[s.chip, sort === id && s.chipActive]}><Text style={[s.chipText, sort === id && { color: "white" }]}>{label}</Text></Pressable>)}</View><Pressable accessibilityRole="button" accessibilityLabel="Refresh cookbook" onPress={load} disabled={loading || busy} style={s.iconButton}><Ionicons name="refresh-outline" size={20} color={C.green} /></Pressable></View>
        {!!notice && <Text accessibilityLiveRegion="polite" style={s.notice}>{notice}</Text>}
        {!!error && !selected && <View style={s.error} accessibilityRole="alert"><Text style={s.errorText}>{error}</Text><Pressable accessibilityRole="button" onPress={load} style={s.textButton}><Text style={s.link}>Try again</Text></Pressable></View>}
        <View style={s.section}><Text style={s.sectionTitle}>{query ? "Search results" : "Made to be made again"}</Text><Text style={s.small}>{visible.length} recipes</Text></View>
      </>}
      renderItem={({ item }) => <View style={s.card}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Open saved recipe ${item.title}`} onPress={() => openRecipe(item)}>
          <DishPhoto recipe={item} /><View style={s.cardBody}><Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text><Text style={s.small}>{item.cookTime || "Your saved recipe"}{item.servings ? ` · Serves ${item.servings}` : ""}</Text></View>
        </Pressable>
        <View style={s.cardFooter}><Pressable accessibilityRole="button" accessibilityLabel={`Edit ${item.title}`} onPress={() => openRecipe(item)} style={s.edit}><Text style={s.link}>View & edit</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`More options for ${item.title}`} style={s.iconButton} onPress={() => { setSelected(item); setConfirm(false); setError(""); }}><Ionicons name="ellipsis-horizontal" size={22} color={C.green} /></Pressable></View>
      </View>}
      ListEmptyComponent={!loading && !error ? <View style={s.empty}><View style={s.heart}><Ionicons name={query ? "search-outline" : "book-outline"} size={30} color={C.green} /></View><Text style={s.sectionTitle}>{query ? "No recipes found" : "Start a delicious collection"}</Text><Text style={s.emptyText}>{query ? "Try a dish name or an ingredient you remember." : "Tap the heart on a recipe you love. We’ll keep it here for your next dinner."}</Text><Pressable accessibilityRole="button" style={s.primary} onPress={() => query ? setQuery("") : router.push("/(taps)")}><Text style={s.white}>{query ? "Clear search" : "Find your first favorite"}</Text></Pressable></View> : null}
      ListFooterComponent={<Text style={s.footer}>Keep the inspiration. Add your own touch.</Text>} />
    <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => { if (!busy) setSelected(null); }}>
      <View style={s.overlay}><View style={s.sheet} accessibilityViewIsModal>
        <ScrollView keyboardShouldPersistTaps="handled"><View style={s.section}><Text style={[s.sectionTitle, s.grow]}>{selected?.title}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close recipe options" disabled={busy} onPress={() => setSelected(null)} style={s.iconButton}><Ionicons name="close" size={24} color={C.green} /></Pressable></View>
        {!!error && <Text accessibilityRole="alert" style={s.errorText}>{error}</Text>}
        {confirm ? <><Text style={s.body}>Remove this recipe from your cookbook? Your saved edits and notes will also be removed.</Text><Pressable accessibilityRole="button" disabled={busy} style={[s.primary, { backgroundColor: C.coral }]} onPress={remove}><Text style={s.white}>{busy ? "Removing…" : "Remove recipe"}</Text></Pressable><Pressable accessibilityRole="button" disabled={busy} style={s.textButton} onPress={() => setConfirm(false)}><Text style={s.link}>Keep recipe</Text></Pressable></> : <>
          <Pressable accessibilityRole="button" style={s.menuRow} onPress={() => { const recipe = selected; setSelected(null); openRecipe(recipe); }}><Ionicons name="create-outline" size={23} color={C.green} /><View style={s.grow}><Text style={s.menuTitle}>View & edit recipe</Text><Text style={s.small}>Ingredients, instructions, and your notes</Text></View></Pressable>
          <Pressable accessibilityRole="button" style={s.menuRow} onPress={() => secondServing(selected)}><Ionicons name="sparkles-outline" size={23} color={C.green} /><View style={s.grow}><Text style={s.menuTitle}>Second serving</Text><Text style={s.small}>Find a new way to enjoy this dish</Text></View></Pressable>
          <Pressable accessibilityRole="button" style={s.menuRow} onPress={() => setConfirm(true)}><Ionicons name="trash-outline" size={23} color={C.coral} /><Text style={s.errorText}>Remove from cookbook</Text></Pressable>
        </>}
        </ScrollView>
      </View></View>
    </Modal>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.cream }, center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.cream, padding: 24 },
  content: { padding: 20, paddingBottom: 80, width: "100%", maxWidth: 720, alignSelf: "center" }, grow: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }, eyebrow: { color: C.gold, fontWeight: "700", fontSize: 9, letterSpacing: 1.6, marginBottom: 10 },
  title: { fontFamily: editorialFont, fontSize: 37, lineHeight: 43, letterSpacing: -1.4, color: C.ink }, heart: { width: 54, height: 54, borderRadius: 18, backgroundColor: C.yellow, alignItems: "center", justifyContent: "center" },
  body: { fontSize: 14, lineHeight: 21, color: C.muted }, banner: { backgroundColor: C.sage, borderRadius: 20, padding: 20, marginVertical: 22, flexDirection: "row", alignItems: "center", gap: 10 },
  bannerTitle: { fontFamily: editorialFont, fontSize: 24, color: C.green, marginBottom: 5 }, discover: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "white", borderRadius: 13, paddingHorizontal: 12, minHeight: 44 },
  link: { color: C.green, fontSize: 12, fontWeight: "700" }, search: { flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 12, borderWidth: 1, borderColor: C.border, backgroundColor: "white", borderRadius: 15 },
  input: { flex: 1, minWidth: 0, color: C.ink, fontSize: 14, paddingVertical: 16 }, toolbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 14, gap: 8 },
  sortOptions: { flexDirection: "row", gap: 8 }, chip: { borderWidth: 1, borderColor: C.border, borderRadius: 22, backgroundColor: "white", paddingHorizontal: 15, minHeight: 44, justifyContent: "center" }, chipActive: { backgroundColor: C.green, borderColor: C.green }, chipText: { fontSize: 12, fontWeight: "700", color: C.green },
  iconButton: { width: 44, height: 44, justifyContent: "center", alignItems: "center" }, section: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 16 }, sectionTitle: { fontFamily: editorialFont, fontSize: 26, color: C.ink, flexShrink: 1 },
  row: { gap: 14 }, card: { width: "100%", backgroundColor: "white", borderWidth: 1, borderColor: C.border, borderRadius: 18, overflow: "hidden", marginBottom: 16 },
  photo: { width: "100%", height: 240 }, photoFallback: { alignItems: "center", justifyContent: "center", backgroundColor: C.sage }, cardBody: { padding: 12, gap: 8 }, cardTitle: { color: C.ink, fontFamily: editorialFont, fontSize: 25, lineHeight: 31, minHeight: 42 }, small: { color: C.muted, fontSize: 12, lineHeight: 18 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderColor: C.border, paddingHorizontal: 12 }, edit: { minHeight: 48, justifyContent: "center", flex: 1 },
  empty: { backgroundColor: "white", borderRadius: 22, borderWidth: 1, borderColor: C.border, padding: 28, alignItems: "center", gap: 15 }, emptyText: { textAlign: "center", color: C.muted, fontSize: 14, lineHeight: 21 },
  primary: { backgroundColor: C.green, borderRadius: 13, padding: 15, alignItems: "center", marginTop: 12 }, white: { color: "white", fontSize: 14, fontWeight: "700" }, footer: { textAlign: "center", color: C.muted, fontSize: 12, paddingVertical: 25 },
  error: { padding: 16, borderRadius: 14, backgroundColor: "#FBE6E0", marginBottom: 15 }, errorText: { color: C.coral, fontSize: 14, lineHeight: 21, fontWeight: "600" }, notice: { color: C.green, fontSize: 13, marginBottom: 15 }, textButton: { minHeight: 44, justifyContent: "center", alignItems: "center" },
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(15,35,26,0.5)", padding: 20 }, sheet: { backgroundColor: C.cream, borderRadius: 24, width: "100%", maxWidth: 480, maxHeight: "85%", padding: 22 },
  menuRow: { flexDirection: "row", gap: 14, paddingVertical: 18, alignItems: "center", borderTopWidth: 1, borderColor: C.border }, menuTitle: { color: C.green, fontSize: 16, fontWeight: "700", marginBottom: 4 },
});

export default function AnimatedFavoritesScreen() {
  return <PageEntrance><FavoritesScreen /></PageEntrance>;
}
