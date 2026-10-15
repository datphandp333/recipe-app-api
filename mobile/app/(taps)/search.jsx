import PageEntrance from "../../components/motion/PageEntrance";
import Pressable from "../../components/motion/MotionPressable";
import CountryDishPreview from "../../components/CountryDishPreview";
import { countryDishPreviews } from "../../services/recipeCatalog";
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { EDITORIAL_COLORS as C, EDITORIAL_FONT as editorialFont } from '../../constants/editorialTheme';
import { MealAPI } from '../../services/mealAPI';
import { DISCOVERY_COLLECTIONS, FEATURED_DISH, filterDiscovery, searchMoreRecipes } from '../../services/discoveryCatalog';
import { recipeImageSource } from '../../data/curatedImages';



function DishPhoto({ recipe, style }) {
  const [failed, setFailed] = useState(false);
  const source = recipeImageSource(recipe);
  if (!source || failed) return <View style={[style, s.photoFallback]}><Ionicons name="restaurant-outline" color={C.green} size={40} /></View>;
  return <Image source={source} style={style} contentFit="cover" transition={180} onError={() => setFailed(true)} accessibilityLabel={recipe.title} />;
}
function DishCard({ recipe, onOpen }) {
  return <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`Open ${recipe.title}`} style={({ pressed }) => [s.card, pressed && s.pressed]}>
    <View style={s.cardPhotoWrap}>
      <DishPhoto recipe={recipe} style={s.cardPhoto} />
      <View style={s.timeBadge}><Ionicons name="time-outline" size={13} color={C.ink} /><Text style={s.timeText}>{recipe.cookTime || 'View recipe'}</Text></View>
      {!!recipe.inspiration && <View style={s.chefBadge}><Ionicons name="sparkles-outline" size={12} color={C.white} /><Text style={s.chefBadgeText}>Chef inspiration</Text></View>}
    </View>
    <View style={s.cardCopy}>
      <Text style={s.recipeOrigin}>{recipe.country || recipe.area || 'MORE TO EXPLORE'}{recipe.difficulty ? ` · ${recipe.difficulty}` : ''}</Text>
      <Text style={s.cardTitle}>{recipe.title}</Text>
      {recipe.isCurated && <Text style={s.cardDescription}>Simmerli home adaptation</Text>}
      {!!recipe.description && <Text style={s.cardDescription} numberOfLines={2}>{recipe.description}</Text>}
      <View style={s.cardFooter}><Text style={s.cookLink}>Make it at home</Text><Ionicons name="arrow-forward" size={18} color={C.green} /></View>
    </View>
  </Pressable>;
}

function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [collection, setCollection] = useState('all');
  const [more, setMore] = useState([]);
  const [busy, setBusy] = useState(false);
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState('');
  const requests = useRef(0);
  useEffect(() => () => { requests.current++; }, []);
  const recipes = useMemo(() => filterDiscovery(query, collection), [query, collection]);
  const countryPreviews = useMemo(() => collection === 'all' && !recipes.length ? countryDishPreviews(query).slice(0, 3) : [], [collection, recipes.length, query]);
  const showFeatured = !query.trim() && collection === 'all';
  const cards = showFeatured ? recipes.filter(recipe => recipe.id !== FEATURED_DISH.id) : recipes;
  const open = recipe => { Keyboard.dismiss(); router.push({ pathname: '/recipe/[id]', params: { id: String(recipe.id) } }); };
  const updateQuery = value => { requests.current++; setQuery(value); setMore([]); setError(''); setBusy(false); setRequested(false); };
  const select = id => { requests.current++; setCollection(id); setMore([]); setError(''); setBusy(false); setRequested(false); };
  const findMore = async () => {
    if (busy || query.trim().length < 2) return;
    const request = ++requests.current;
    const localIds = new Set(recipes.map(recipe => String(recipe.id)));
    setBusy(true); setError(''); setRequested(false); Keyboard.dismiss();
    try {
      const results = await searchMoreRecipes(query, MealAPI);
      if (request === requests.current) { setMore(results.filter(recipe => !localIds.has(String(recipe.id)))); setRequested(true); }
    } catch (failure) {
      if (request === requests.current) setError(failure.message || 'Could not search more recipes. Your curated collection is still available.');
    } finally { if (request === requests.current) setBusy(false); }
  };
  const title = query.trim() ? 'For your craving' : collection === 'chef' ? 'From chef kitchens' : collection === 'quick' ? 'Good food. Less time.' : collection === 'sweet' ? 'Save room for something sweet' : collection === 'world' ? 'A table without borders' : 'Favorites worth making';

  const header = <>
    <View style={s.masthead}><Text style={s.wordmark}>simmerli<Text style={s.wordmarkDot}>.</Text></Text><View style={s.edition}><Text style={s.editionText}>THE KITCHEN EDIT</Text><Ionicons name="restaurant-outline" size={15} color={C.gold} /></View></View>
    <Text style={s.pageTitle}>Something{ '\n' }extraordinary.</Text>
    <Text style={s.pageSubtitle}>Restaurant inspiration. Everyday ingredients.{ '\n' }Your next favorite starts here.</Text>
    <View style={s.searchBox}>
      <Ionicons name="search-outline" color={C.green} size={21} />
      <TextInput value={query} onChangeText={updateQuery} placeholder="Dish, ingredient, or cuisine…" placeholderTextColor={C.muted} style={s.input} accessibilityLabel="Search dishes, ingredients, or cuisines" autoCorrect={false} returnKeyType="search" onSubmitEditing={() => Keyboard.dismiss()} />
      {!!query && <Pressable onPress={() => updateQuery('')} accessibilityRole="button" accessibilityLabel="Clear search" style={s.clear}><Ionicons name="close" size={18} color={C.green} /></Pressable>}
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters} keyboardShouldPersistTaps="handled">
      {DISCOVERY_COLLECTIONS.map(item => <Pressable key={item.id} onPress={() => select(item.id)} accessibilityRole="button" accessibilityState={{ selected: collection === item.id }} style={[s.filter, collection === item.id && s.filterActive]}>
        <Text style={[s.filterText, collection === item.id && s.filterTextActive]}>{item.label}</Text>
      </Pressable>)}
    </ScrollView>
    {showFeatured && <>
      <View style={s.sectionEyebrow}><View style={s.rule} /><Text style={s.eyebrow}>THE DISH TO TRY</Text><View style={s.rule} /></View>
      <Pressable onPress={() => open(FEATURED_DISH)} accessibilityRole="button" accessibilityLabel={`Open featured ${FEATURED_DISH.title}`} style={({ pressed }) => [s.hero, pressed && s.pressed]}>
        <DishPhoto recipe={FEATURED_DISH} style={s.heroPhoto} />
        <LinearGradient colors={['transparent', 'rgba(16,30,21,0.24)', 'rgba(16,30,21,0.94)']} locations={[0, 0.35, 1]} style={StyleSheet.absoluteFillObject} />
        <View style={s.heroLabel}><Text style={s.heroLabelText}>THE CHEF-INSPIRED EDIT</Text></View>
        <View style={s.heroCopy}><Text style={s.heroKicker}>A LITTLE PARIS, AT HOME</Text><Text style={s.heroTitle}>The art of{ '\n' }a beautiful risotto.</Text><View style={s.heroFooter}><Text style={s.heroMeta}>35 min · One pan · Serves 2</Text><View style={s.heroArrow}><Ionicons name="arrow-forward" size={21} color={C.ink} /></View></View></View>
      </Pressable>
      <View style={s.editorNote}><Ionicons name="sparkles-outline" size={17} color={C.gold} /><Text style={s.editorNoteText}>Inspired by Simone Zanoni’s risotto feature in the MICHELIN Guide. Our mushroom version brings it home.</Text></View>
    </>}
    <View style={s.sectionHeader}><View style={s.sectionTitleWrap}><Text style={s.eyebrow}>{query.trim() ? 'THE SEARCH EDIT' : 'HANDPICKED FOR YOUR KITCHEN'}</Text><Text style={s.sectionTitle}>{title}</Text></View><Text style={s.count}>{cards.length} dishes</Text></View>
    {countryPreviews.map(country => <CountryDishPreview key={country.id} country={country} onDiscuss={() => router.push({ pathname: '/ai-recipe', params: { prompt: `I’d like to explore ${country.dish} associated with ${country.name}. Explain traditional preparation and clearly label any home adaptations.` } })} />)}
    {collection === 'chef' && <Text style={s.collectionNote}>Explore the Guide’s chef ideas through our original home adaptations. Each recipe links to its inspiration.</Text>}
  </>;
  const footer = <>
    {query.trim().length >= 2 && collection === 'all' && <View style={s.widerSearch}>
      <Text style={s.widerTitle}>Keep exploring</Text><Text style={s.cardDescription}>Search beyond our handpicked collection.</Text>
      <Pressable onPress={findMore} disabled={busy} accessibilityRole="button" style={s.widerButton}>
        {busy ? <ActivityIndicator size="small" color={C.white} /> : <Ionicons name="search-outline" size={17} color={C.white} />}<Text style={s.widerButtonText}>{busy ? 'Searching more recipes…' : 'Search more recipes'}</Text>
      </Pressable>
      {!!error && <Text style={s.error} accessibilityLiveRegion="polite">{error}</Text>}
      {requested && !more.length && <Text style={s.collectionNote}>No additional matches. Try a dish name or a single ingredient.</Text>}
    </View>}
    {!!more.length && <><Text style={s.sectionTitle}>More to explore</Text><Text style={s.collectionNote}>Additional recipes from TheMealDB.</Text>{more.map(recipe => <DishCard key={recipe.id} recipe={recipe} onOpen={() => open(recipe)} />)}</>}
    <View style={s.endNote}><Ionicons name="restaurant-outline" size={19} color={C.gold} /><Text style={s.endNoteText}>Great meals don’t need a reservation.</Text><Text style={s.finePrint}>Handpicked classics. Original home adaptations.{ '\n' }Cooking times are estimates.</Text></View>
  </>;
  return <SafeAreaView style={s.page} edges={['top', 'left', 'right']}>
    <FlatList data={cards} keyExtractor={recipe => String(recipe.id)} renderItem={({ item }) => <DishCard recipe={item} onOpen={() => open(item)} />}
      ListHeaderComponent={header} ListFooterComponent={footer} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}
      contentContainerStyle={s.content} initialNumToRender={3} windowSize={7}
      ListEmptyComponent={countryPreviews.length ? null : <View style={s.empty}><Ionicons name="search-outline" size={30} color={C.green} /><Text style={s.emptyTitle}>A different craving?</Text><Text style={s.cardDescription}>Try “pasta,” “mushroom,” or another collection.</Text><Pressable onPress={() => { updateQuery(''); select('all'); }} accessibilityRole="button" style={s.reset}><Text style={s.cookLink}>See all handpicked dishes →</Text></Pressable></View>} />
  </SafeAreaView>;
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.background }, content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 120, width: '100%', maxWidth: 720, alignSelf: 'center' },
  masthead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 26 }, wordmark: { fontFamily: editorialFont, fontSize: 31, color: C.ink, letterSpacing: -1.6 }, wordmarkDot: { color: C.gold }, edition: { flexDirection: 'row', gap: 7, alignItems: 'center', flexShrink: 1 }, editionText: { fontSize: 9, letterSpacing: 1.4, color: C.muted, fontWeight: '700' },
  pageTitle: { fontFamily: editorialFont, fontSize: 40, lineHeight: 44, letterSpacing: -1.5, color: C.ink }, pageSubtitle: { color: C.muted, fontSize: 14, lineHeight: 22, marginTop: 12, marginBottom: 22 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 11, borderColor: C.line, borderWidth: 1, borderRadius: 15, paddingLeft: 16, backgroundColor: C.white, minHeight: 54 }, input: { flex: 1, minWidth: 0, fontSize: 14, color: C.ink, paddingVertical: 16 }, clear: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  filters: { gap: 8, paddingVertical: 17, paddingRight: 4 }, filter: { borderWidth: 1, borderColor: C.line, borderRadius: 24, paddingHorizontal: 15, paddingVertical: 12, minHeight: 44, justifyContent: 'center' }, filterActive: { backgroundColor: C.green, borderColor: C.green }, filterText: { fontSize: 12, color: C.ink, fontWeight: '600' }, filterTextActive: { color: C.white },
  sectionEyebrow: { flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 10, marginBottom: 16 }, rule: { flex: 1, height: 1, backgroundColor: C.line }, eyebrow: { fontSize: 9, fontWeight: '700', color: C.gold, letterSpacing: 1.6 },
  hero: { height: 340, borderRadius: 22, overflow: 'hidden', backgroundColor: C.sage }, heroPhoto: { width: '100%', height: '100%' }, heroLabel: { position: 'absolute', left: 18, top: 18, backgroundColor: '#F5ECD8', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 5 }, heroLabelText: { color: C.ink, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 }, heroCopy: { position: 'absolute', left: 22, right: 22, bottom: 20 }, heroKicker: { color: '#E6D4B4', letterSpacing: 1.6, fontWeight: '700', fontSize: 9, marginBottom: 10 }, heroTitle: { fontFamily: editorialFont, fontSize: 33, lineHeight: 38, letterSpacing: -0.9, color: C.white }, heroFooter: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, heroMeta: { color: '#EBEEE6', fontSize: 12, flexShrink: 1 }, heroArrow: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F5ECD8', alignItems: 'center', justifyContent: 'center' },
  editorNote: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', paddingHorizontal: 4, marginTop: 14, marginBottom: 15 }, editorNoteText: { flex: 1, minWidth: 0, color: C.muted, fontSize: 11, lineHeight: 17 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 20, marginBottom: 20 }, sectionTitleWrap: { flex: 1 }, sectionTitle: { fontFamily: editorialFont, color: C.ink, fontSize: 27, lineHeight: 32, marginTop: 7 }, count: { color: C.muted, fontSize: 11, paddingBottom: 4 },
  card: { borderRadius: 19, overflow: 'hidden', backgroundColor: C.white, marginBottom: 22, borderWidth: 1, borderColor: C.line }, pressed: { opacity: 0.86 }, cardPhotoWrap: { position: 'relative' }, cardPhoto: { height: 218, width: '100%' }, photoFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.sage }, timeBadge: { position: 'absolute', left: 14, top: 14, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFFF0', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 7, maxWidth: '85%' }, timeText: { color: C.ink, fontSize: 10, flexShrink: 1, fontWeight: '700' }, chefBadge: { position: 'absolute', bottom: 13, left: 14, backgroundColor: C.green, borderRadius: 5, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 5 }, chefBadgeText: { color: C.white, fontSize: 10, fontWeight: '600' },
  cardCopy: { padding: 18 }, recipeOrigin: { color: C.gold, fontSize: 10, letterSpacing: 1, fontWeight: '700', textTransform: 'uppercase' }, cardTitle: { fontFamily: editorialFont, color: C.ink, fontSize: 25, lineHeight: 30, marginTop: 8 }, cardDescription: { fontSize: 13, lineHeight: 20, color: C.muted, marginTop: 8 }, cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.line }, cookLink: { color: C.green, fontSize: 12, fontWeight: '700' }, collectionNote: { fontSize: 12, lineHeight: 19, color: C.muted, marginBottom: 18 },
  empty: { backgroundColor: C.sage, borderRadius: 18, padding: 24, alignItems: 'center', gap: 8, marginBottom: 20 }, emptyTitle: { fontFamily: editorialFont, fontSize: 25, color: C.ink }, reset: { paddingVertical: 12 }, widerSearch: { borderRadius: 18, borderWidth: 1, borderColor: C.line, padding: 20, marginBottom: 22 }, widerTitle: { fontFamily: editorialFont, fontSize: 25, color: C.ink }, widerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: C.green, borderRadius: 12, padding: 15, marginTop: 16, minHeight: 48 }, widerButtonText: { color: C.white, fontWeight: '700', fontSize: 13 }, error: { color: '#9D4638', fontSize: 13, lineHeight: 20, marginTop: 12 }, endNote: { alignItems: 'center', paddingVertical: 22, gap: 11 }, endNoteText: { fontFamily: editorialFont, color: C.ink, fontSize: 21, textAlign: 'center' }, finePrint: { color: C.muted, fontSize: 10, lineHeight: 16, textAlign: 'center' },
});

export default function AnimatedSearchScreen() {
  return <PageEntrance><SearchScreen /></PageEntrance>;
}
