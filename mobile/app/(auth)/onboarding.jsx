import KitchenCompanion from '../../components/chef/KitchenCompanion';
import PageEntrance from "../../components/motion/PageEntrance";
import TouchableOpacity from "../../components/motion/MotionPressable";
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SimmerliMark } from '../../components/auth/SimmerliBrand';
import { EDITORIAL_COLORS as E, EDITORIAL_FONT } from '../../constants/editorialTheme';
import { backOrReplace } from '../../services/navigation';
import { recipeImageSource } from '../../data/curatedImages';
import { ONBOARDING_GOALS, ONBOARDING_INGREDIENTS, onboardingPicks } from '../../services/onboarding';

function ContinueButton({ title, onPress, disabled = false }) {
  return <TouchableOpacity accessibilityRole="button" disabled={disabled} accessibilityState={{ disabled }} onPress={onPress} style={[s.button, disabled && s.disabled]}><Text style={s.buttonText}>{title}</Text><Ionicons name="arrow-forward" size={19} color={E.white} /></TouchableOpacity>;
}

export default function Onboarding() {
  const router = useRouter();
  const scroll = useRef(null);
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [error, setError] = useState('');
  const picks = useMemo(() => onboardingPicks(goal, ingredients), [goal, ingredients]);
  const move = next => { setStep(next); setExpanded(null); setError(''); scroll.current?.scrollTo({ y: 0, animated: false }); };
  const toggle = id => setIngredients(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]);
  const link = async url => { try { await Linking.openURL(url); } catch { setError('Could not open the source. Please try again.'); } };

  return <SafeAreaView style={s.page}>
    <View style={s.top}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={step ? 'Previous onboarding step' : 'Back to welcome'} style={s.back} onPress={() => step ? move(step - 1) : backOrReplace(router, '/(auth)/welcome')}><Ionicons name="arrow-back" size={22} color={E.green} /></TouchableOpacity>
      <View style={s.brand} accessible accessibilityLabel="Simmerli"><SimmerliMark size={23} /><Text style={s.wordmark}>simmerli.</Text></View>
      <TouchableOpacity accessibilityRole="button" onPress={() => router.push('/(auth)/sign-up')} style={s.back}><Text style={s.link}>Skip</Text></TouchableOpacity>
    </View>
    <View style={s.progress} accessible accessibilityLabel={`Step ${step + 1} of 3`}>{[0, 1, 2].map(index => <View key={index} style={[s.track, index <= step && s.filled]} />)}</View>
    <PageEntrance key={step}><ScrollView ref={scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.eyebrow}>{['YOUR KITCHEN, YOUR WAY', 'A FEW FAMILIAR INGREDIENTS', 'A FIRST TASTE OF SIMMERLI'][step]}</Text>
      <Text accessibilityRole="header" style={s.title}>{['What would make\ndinner better?', 'What’s usually\nin your kitchen?', 'Your next favorite\ncould be right here.'][step]}</Text>
      <View style={s.guide}><KitchenCompanion key={`${step}:${goal}:${ingredients.join("-")}`} size={62} mood={step === 2 ? "celebrate" : "welcome"} /><Text style={[s.body, s.grow]}>{['Pick what matters today. Let’s find a dish worth making.', 'Choose a few, or let us surprise you. These choices help shape your first recipe picks.', 'Real recipes, picked from our collection using your answers. Open one and see what you could make.'][step]}</Text></View>
      {step === 0 && <>
        <View style={s.options}>{ONBOARDING_GOALS.map(item => <TouchableOpacity key={item.id} accessibilityRole="radio" aria-checked={goal === item.id} accessibilityState={{ selected: goal === item.id, checked: goal === item.id }} onPress={() => setGoal(item.id)} style={[s.option, goal === item.id && s.selected]}>
          <View style={s.optionIcon}><Ionicons name={item.icon} size={23} color={E.green} /></View><View style={s.grow}><Text style={s.optionTitle}>{item.title}</Text><Text style={s.small}>{item.detail}</Text></View><Ionicons name={goal === item.id ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={goal === item.id ? E.green : E.line} />
        </TouchableOpacity>)}</View>
      </>}
      {step === 1 && <>
        <View style={s.chips}>{ONBOARDING_INGREDIENTS.map(item => <TouchableOpacity key={item.id} accessibilityRole="checkbox" aria-checked={ingredients.includes(item.id)} accessibilityState={{ checked: ingredients.includes(item.id) }} onPress={() => toggle(item.id)} style={[s.chip, ingredients.includes(item.id) && s.selected]}><Ionicons name={ingredients.includes(item.id) ? 'checkmark-circle' : 'add-circle-outline'} size={19} color={E.green} /><Text style={s.optionTitle}>{item.label}</Text></TouchableOpacity>)}</View>
        <View style={s.note}><Ionicons name="sparkles-outline" size={20} color={E.gold} /><Text style={[s.small, s.grow]}>A few ingredients can be the start of something delicious. You’ll see the full ingredient list before cooking.</Text></View>
        <Text style={s.fine}>Suggestions only. Check each recipe for dietary needs and allergies.</Text>
      </>}
      {step === 2 && <>
        <View style={s.summary}><Ionicons name="checkmark-circle" size={22} color={E.green} /><Text style={[s.small, s.grow]}>{goal === 'quick' ? '30 minutes or less' : goal === 'world' ? 'Different places, fresh inspiration' : 'Inspired by your kitchen'}{ingredients.length ? ` · ${ingredients.length} ingredient choices` : ' · A little surprise'}</Text></View>
        {picks.map(({ recipe, matched }) => <View key={recipe.id} style={s.recipe}>
          {recipeImageSource(recipe) ? <Image source={recipeImageSource(recipe)} contentFit="cover" style={s.photo} accessibilityLabel={`${recipe.title}, serving suggestion`} /> : null}
          <View style={s.recipeBody}>
            <Text style={s.eyebrow}>{recipe.country} · {recipe.cookTime}</Text><Text style={s.recipeTitle}>{recipe.title}</Text>
            <Text style={s.small}>{matched.length ? `Includes your picks: ${matched.map(id => ONBOARDING_INGREDIENTS.find(item => item.id === id).label).join(', ')}.` : 'Another idea from our collection.'}</Text>
            <Text style={s.fine}>Simmerli home adaptation · you may need more ingredients.</Text>
            <TouchableOpacity accessibilityRole="button" aria-expanded={expanded === recipe.id} accessibilityState={{ expanded: expanded === recipe.id }} onPress={() => setExpanded(previous => previous === recipe.id ? null : recipe.id)} style={s.preview}><Text style={s.link}>{expanded === recipe.id ? 'Close recipe preview' : `Preview ${recipe.title}`}</Text><Ionicons name={expanded === recipe.id ? 'chevron-up' : 'chevron-down'} size={18} color={E.green} /></TouchableOpacity>
            {expanded === recipe.id && <View style={s.fullRecipe}>
              <Text style={s.optionTitle}>Ingredients · serves {recipe.servings}</Text>
              {recipe.ingredients.map((item, index) => <Text key={index} style={s.small}>• {typeof item === 'string' ? item : item.label || `${item.amount || item.measure || ''} ${item.name}`}</Text>)}
              <Text style={s.optionTitle}>Let’s make it</Text>
              {recipe.instructions.map((item, index) => <Text key={index} style={s.small}>{index + 1}. {typeof item === 'string' ? item : item.instruction}</Text>)}
              <Text style={s.fine}>{recipe.recipeNote}</Text>
              {!!recipe.source && <TouchableOpacity accessibilityRole="link" style={s.preview} onPress={() => link(recipe.source)}><Text style={s.link}>Explore the credited source ↗</Text></TouchableOpacity>}
              {!!recipe.imageCredit && <TouchableOpacity accessibilityRole="link" style={s.preview} onPress={() => link(recipe.imageSourceUrl)}><Text style={s.fine}>{recipe.imageCredit} ↗</Text></TouchableOpacity>}
              {!!recipe.imageLicenseUrl && <TouchableOpacity accessibilityRole="link" style={s.preview} onPress={() => link(recipe.imageLicenseUrl)}><Text style={s.fine}>Photo license: {recipe.imageLicense} ↗</Text></TouchableOpacity>}
            </View>}
          </View>
        </View>)}
        {error ? <Text style={s.error} accessibilityLiveRegion="polite">{error}</Text> : null}
        <View style={s.note}><Ionicons name="heart-outline" size={22} color={E.green} /><Text style={[s.body, s.grow]}>Make room for more favorites. Create an account to save recipes and build your pantry.</Text></View>
        <TouchableOpacity accessibilityRole="button" style={s.preview} onPress={() => move(0)}><Text style={s.link}>Try different answers</Text></TouchableOpacity>
      </>}
      <TouchableOpacity accessibilityRole="button" style={s.signIn} onPress={() => router.push('/(auth)/sign-in')}><Text style={s.small}>Already have an account? <Text style={s.link}>Sign in</Text></Text></TouchableOpacity>
    </ScrollView></PageEntrance>
    <View style={s.bottomCTA}>
      <ContinueButton title={step === 0 ? "Find my inspiration" : step === 1 ? (ingredients.length ? "Show my recipe picks" : "Surprise me") : "Create my account"} disabled={step === 0 && !goal} onPress={() => step < 2 ? move(step + 1) : router.push("/(auth)/sign-up")} />
      {step === 2 && <Text style={[s.fine, { textAlign: 'center' }]}>Save favorites. Make your kitchen feel like you.</Text>}
    </View>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  guide: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  page: { flex: 1, backgroundColor: E.background },
  bottomCTA: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 12, gap: 8, backgroundColor: E.background, borderTopWidth: 1, borderTopColor: E.line },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  back: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 7 }, wordmark: { fontFamily: EDITORIAL_FONT, fontSize: 25, color: E.green, letterSpacing: -1 },
  progress: { flexDirection: 'row', gap: 6, paddingHorizontal: 24, paddingBottom: 12, width: '100%', maxWidth: 620, alignSelf: 'center' }, track: { flex: 1, height: 4, borderRadius: 4, backgroundColor: E.line }, filled: { backgroundColor: E.green },
  content: { padding: 24, gap: 20, paddingBottom: 36, maxWidth: 620, width: '100%', alignSelf: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: E.gold },
  title: { fontFamily: EDITORIAL_FONT, fontSize: 36, lineHeight: 43, color: E.ink, letterSpacing: -0.8 },
  body: { color: E.muted, fontSize: 15, lineHeight: 23 }, small: { color: E.muted, fontSize: 14, lineHeight: 21 }, fine: { color: E.muted, fontSize: 12, lineHeight: 19 },
  grow: { flex: 1, minWidth: 0 }, options: { gap: 12 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: E.white, borderRadius: 18, borderWidth: 1, borderColor: E.line },
  optionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: E.sage },
  optionTitle: { color: E.ink, fontSize: 15, fontWeight: '600', lineHeight: 22 }, selected: { backgroundColor: E.sage, borderColor: E.green },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, chip: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: E.line, backgroundColor: E.white },
  note: { padding: 18, borderRadius: 16, backgroundColor: E.cream, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  button: { minHeight: 56, borderRadius: 16, backgroundColor: E.green, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 }, buttonText: { color: E.white, fontSize: 16, fontWeight: '600', flexShrink: 1 }, disabled: { opacity: 0.45 },
  link: { color: E.green, fontWeight: '600', lineHeight: 22, flexShrink: 1 }, signIn: { minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  summary: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 16, backgroundColor: E.sage, borderRadius: 16 },
  recipe: { backgroundColor: E.white, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: E.line }, photo: { width: '100%', height: 180 }, recipeBody: { padding: 18, gap: 12 }, recipeTitle: { fontFamily: EDITORIAL_FONT, color: E.ink, fontSize: 25, lineHeight: 31 },
  preview: { minHeight: 44, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 8 }, fullRecipe: { gap: 12 }, error: { color: E.coral, lineHeight: 21 },
});
