import KitchenCompanion from "../components/chef/KitchenCompanion";
import SuccessMoment from "../components/motion/SuccessMoment";
import TouchableOpacity from "../components/motion/MotionPressable";
import { EDITORIAL_COLORS as E, EDITORIAL_FONT as editorialFont } from "../constants/editorialTheme";
import { betaFetch } from "../services/betaRequest";
import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../constants/api";
import CookingPreferences from "../components/CookingPreferences";

const GREEN = "#245B4B";
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const amount = value => Number(value).toLocaleString(undefined, { maximumFractionDigits: 3 });

function Button({ label, onPress, disabled, secondary = false }) {
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} onPress={onPress}
      disabled={disabled} style={[styles.button, secondary && styles.secondary, disabled && styles.disabled]}>
      <Text style={[styles.buttonText, secondary && styles.green]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function MealPlannerScreen() {
  const { userId, isLoaded, getToken } = useAuth();
  const router = useRouter();
  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" onPress={() => router.replace("/(taps)/pantry")} style={styles.back}>
          <Ionicons name="arrow-back" size={20} color={GREEN} /><Text style={styles.link}>Pantry</Text>
        </TouchableOpacity>
      </View>
      {!isLoaded ? <ActivityIndicator color={GREEN} /> : !userId
        ? <Text style={styles.subtitle}>Sign in to plan dinners with your pantry.</Text>
        : <Planner key={userId} getToken={getToken} />}
    </SafeAreaView>
  );
}

function Planner({ getToken }) {
  const [servings, setServings] = useState("2");
  const [maximumCookingTime, setMaximumCookingTime] = useState("30");
  const [current, setCurrent] = useState(null);
  const [savedMoment, setSavedMoment] = useState(0);
  const [saved, setSaved] = useState([]);
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [listError, setListError] = useState("");
  const [checked, setChecked] = useState({});
  const [cooking, setCooking] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [memory, setMemory] = useState(null);
  const [preferencesDirty, setPreferencesDirty] = useState(false);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [suggestedNote, setSuggestedNote] = useState("");
  const scroll = useRef(null);
  const servingsEdited = useRef(false);
  const preferencesSaved = useCallback(preferences => {
    setMemory(preferences);
    if (!servingsEdited.current) setServings(String(preferences.householdSize));
  }, []);
  const lock = useRef(false);
  const controllers = useRef(new Set());
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const pending = controllers.current;
    return () => {
      mounted.current = false;
      pending.forEach(controller => controller.abort());
    };
  }, []);

  const request = useCallback(async (path = "", body, method) => {
    const controller = new AbortController();
    controllers.current.add(controller);
    const timer = setTimeout(() => controller.abort(), body && path === "/drafts" ? 110000 : 15000);
    try {
      const token = await getToken();
      if (!mounted.current) throw new Error("Planner closed.");
      if (!token) throw new Error("Please sign in again.");
      const response = await betaFetch(`${API_URL}/pantry/meal-plans${path}`, {
        method: method || (body ? "POST" : "GET"), signal: controller.signal,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) throw new Error(data?.message || "The planner could not complete this request.");
      return data;
    } catch (failure) {
      if (failure.name === "AbortError") throw new Error("The request timed out. Please try again.");
      throw failure;
    } finally {
      clearTimeout(timer);
      controllers.current.delete(controller);
    }
  }, [getToken]);

  const loadSaved = useCallback(async () => {
    try {
      const data = await request();
      if (mounted.current) { setSaved(data.plans); setListError(""); }
    } catch (failure) {
      if (mounted.current) setListError(failure.message);
    } finally { if (mounted.current) setLoading(false); }
  }, [request]);
  useEffect(() => {
    let active = true;
    request().then(data => {
      if (active) { setSaved(data.plans); setListError(""); }
    }).catch(failure => {
      if (active) setListError(failure.message);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [request]);

  const act = async (action, operation) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(action);
    setError("");
    try { await operation(); }
    catch (failure) { if (mounted.current) setError(failure.message); }
    finally { lock.current = false; if (mounted.current) setBusy(""); }
  };
  const generate = () => act("planning", async () => {
    setSavedMoment(0);
    const data = await request("/drafts", { servings: Number(servings), maximumCookingTime: Number(maximumCookingTime), startDate: today() });
    if (mounted.current) { setCurrent(data.plan); setChecked({}); setCooking(null); }
  });
  const save = () => act("saving", async () => {
    const data = await request(`/${current.id}/save`, { startDate: today() });
    if (mounted.current) {
      setCurrent(data.plan);
      setSavedMoment(value => value + 1);
      setSaved(previous => [data.plan, ...previous.filter(plan => plan.id !== data.plan.id)].slice(0, 10));
    }
  });
  const plan = current?.plan;
  const reviewCooking = day => act("reviewing", async () => {
    const data = await request(`/${current.id}/meals/${day}/completion`);
    if (!mounted.current) return;
    if (data.completion) {
      setCurrent(previous => ({ ...previous, cookedMeals: { ...previous.cookedMeals, [day]: data.completion } }));
      setCooking(null);
      return;
    }
    setFeedback("");
    setCooking({ day, ingredients: data.ingredients.map(item => ({ ...item, quantity: String(item.quantity) })) });
  });
  const completeCooking = () => act("completing", async () => {
    if (cooking.ingredients.some(item => !item.quantity.trim() || !Number.isFinite(Number(item.quantity)) || Number(item.quantity) < 0)) {
      throw new Error("Enter a nonnegative amount for each ingredient. Use 0 for ingredients you did not use.");
    }
    const data = await request(`/${current.id}/meals/${cooking.day}/completion`, {
      consumed: cooking.ingredients.map(item => ({ pantryItemId: item.pantryItemId, name: item.name, unit: item.unit, quantity: Number(item.quantity) })), feedback,
    });
    if (mounted.current) {
      setCurrent(data.plan);
      setSaved(previous => previous.map(entry => entry.id === data.plan.id ? data.plan : entry));
      setCooking(null);
    }
  });

  return (
    <ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Three dinners, less waste</Text>
      <Text style={styles.subtitle}>Start today. Choose your portions and time. We’ll use your pantry and saved preferences.</Text>
      <View style={styles.card}>
        <Text style={styles.label}>How many people?</Text>
        <View style={styles.stepper}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Fewer servings" disabled={Boolean(busy) || Number(servings) <= 1} style={styles.stepButton} onPress={() => { servingsEdited.current = true; setServings(String(Math.max(1, Number(servings) - 1))); }}><Ionicons name="remove" size={22} color={GREEN} /></TouchableOpacity>
          <Text style={styles.people} accessibilityLiveRegion="polite">{servings} {Number(servings) === 1 ? "person" : "people"}</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="More servings" disabled={Boolean(busy) || Number(servings) >= 8} style={styles.stepButton} onPress={() => { servingsEdited.current = true; setServings(String(Math.min(8, Number(servings) + 1))); }}><Ionicons name="add" size={22} color={GREEN} /></TouchableOpacity>
        </View>
        <Text style={styles.label}>Time per dinner</Text>
        <View style={styles.timeOptions}>{[15, 30, 45, 60].map(minutes => <TouchableOpacity key={minutes} accessibilityRole="button" accessibilityState={{ selected: Number(maximumCookingTime) === minutes }} disabled={Boolean(busy)} onPress={() => setMaximumCookingTime(String(minutes))} style={[styles.timeChip, Number(maximumCookingTime) === minutes && styles.timeSelected]}><Text style={[styles.link, Number(maximumCookingTime) === minutes && { color: "white" }]}>{minutes} min</Text></TouchableOpacity>)}</View>
        <View style={styles.customTime}><Text style={styles.subtitle}>Or set minutes (15–120)</Text><TextInput accessibilityLabel="Maximum cooking time" keyboardType="number-pad" value={maximumCookingTime} onChangeText={setMaximumCookingTime} editable={!busy} style={[styles.input, { width: 72 }]} maxLength={3} /></View>
        <Button label={busy === "planning" ? "Preparing your dinners…" : "Plan three dinners"} onPress={generate} disabled={Boolean(busy) || !memory || preferencesSaving || preferencesDirty || !Number.isInteger(Number(maximumCookingTime)) || Number(maximumCookingTime) < 15 || Number(maximumCookingTime) > 120} />
        {busy === "planning" ? <View style={styles.progress} accessibilityLiveRegion="polite"><KitchenCompanion size={46} mood="thinking" /><Text style={styles.subtitle}>Reading your pantry, creating recipes, and checking shared quantities. This may take up to 90 seconds.</Text></View> : null}
      </View>
      <CookingPreferences request={request} onSaved={preferencesSaved} onSaving={setPreferencesSaving} disabled={Boolean(busy)} suggestedNote={suggestedNote} onDirty={setPreferencesDirty} clearSuggestion={() => setSuggestedNote("")} />
      {preferencesDirty ? <Text style={styles.note}>Open Cooking preferences and save your changes to continue.</Text> : null}
      {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
      {savedMoment > 0 && current?.savedAt && <SuccessMoment key={savedMoment} message="Your dinners and grocery list are saved." />}
      {plan ? <>
        <View style={styles.banner}>
          <Text style={styles.sectionTitle}>{current.savedAt ? "Saved meal plan" : "Review your draft"}</Text>
          <Text style={styles.subtitle}>{plan.servings} servings · starts {plan.startDate} · up to {plan.maximumCookingTime} min per dinner</Text>
          <Text style={styles.subtitle}>Quantities below are for all servings, not per person.</Text>
          {plan.preferences ? <Text style={styles.subtitle}>Preferences used: {plan.preferences.spiceLevel === "any" ? "no spice preference" : `${plan.preferences.spiceLevel} spice`} · Avoid: {plan.preferences.dislikedIngredients.join(", ") || "none"}{plan.preferences.notes ? ` · ${plan.preferences.notes}` : ""}</Text> : null}
        </View>
        {plan.meals.map(meal => <View key={meal.day} style={styles.card}>
          <Text style={styles.eyebrow}>DINNER {meal.day} · {meal.date}</Text>
          <Text style={styles.sectionTitle}>{meal.title}</Text>
          <Text style={styles.subtitle}>{meal.totalTime} min · {meal.servings} servings</Text>
          <Text style={styles.reason}>{meal.reason}</Text>
          <Text style={styles.label}>Ingredients</Text>
          {meal.ingredients.map((ingredient, index) => <View key={index} style={styles.ingredient}>
            <Text style={styles.body}>{amount(ingredient.quantity)} {ingredient.unit} {ingredient.name}</Text>
            <Text style={styles.subtitle}>Pantry: {amount(ingredient.pantryUsed)} {ingredient.accountingUnit}{ingredient.toBuy > 0 ? ` · Buy: ${amount(ingredient.toBuy)} ${ingredient.accountingUnit}` : " · Covered"}</Text>
          </View>)}
          <Text style={styles.label}>Cooking steps</Text>
          {meal.instructions.map((step, index) => <Text key={index} style={styles.body}>{index + 1}. {step}</Text>)}
          {current.cookedMeals?.[meal.day] ? <View style={styles.banner}>
            <Text style={styles.link}>Cooked · {new Date(current.cookedMeals[meal.day].completedAt).toLocaleDateString()}</Text>
            <Text style={styles.subtitle}>Pantry usage recorded. This dinner cannot be deducted again.</Text>
            {current.cookedMeals[meal.day].feedback ? <Text style={styles.body}>Your feedback: {current.cookedMeals[meal.day].feedback}</Text> : null}
            {current.cookedMeals[meal.day].feedback ? <Button label="Remember this feedback" secondary disabled={Boolean(busy)} onPress={() => { setSuggestedNote(current.cookedMeals[meal.day].feedback); scroll.current?.scrollTo({ y: 0, animated: true }); }} /> : null}
          </View> : current.savedAt ? <>
            {cooking?.day === meal.day ? <View style={styles.banner}>
              <Text style={styles.sectionTitle}>What did you use?</Text>
              <Text style={styles.subtitle}>Adjust actual pantry amounts below. Confirming deducts these amounts and marks this dinner cooked. Use 0 for anything you did not use.</Text>
              {!cooking.ingredients.length ? <Text style={styles.subtitle}>This dinner has no allocated pantry ingredients. Confirming will only mark it cooked.</Text> : null}
              {cooking.ingredients.map((item, index) => <View key={item.pantryItemId} style={styles.ingredient}>
                <Text style={styles.label}>{item.name} · {item.unit}</Text>
                <Text style={styles.subtitle}>{item.missing ? "No longer available in the expected form. Nothing will be deducted." : `${amount(item.available)} ${item.unit} currently available`}</Text>
                <TextInput accessibilityLabel={`Amount of ${item.name} used in ${item.unit}`} style={styles.input} keyboardType="decimal-pad"
                  value={item.quantity} editable={!busy && !item.missing} onChangeText={value => setCooking(previous => ({ ...previous,
                    ingredients: previous.ingredients.map((entry, position) => position === index ? { ...entry, quantity: value } : entry),
                  }))} />
              </View>)}
              <Text style={styles.label}>How was it? · optional</Text>
              <TextInput accessibilityLabel="Meal feedback" style={styles.input} multiline maxLength={500} editable={!busy} value={feedback} onChangeText={setFeedback} placeholder="e.g. Too spicy, or make again" />
              <Text style={styles.note}>Only listed pantry items are deducted. Feedback is saved with this meal.</Text>
              <Button label={busy === "completing" ? "Recording…" : "Confirm usage & mark cooked"} onPress={completeCooking} disabled={Boolean(busy)} />
              <Button label="Cancel" secondary onPress={() => setCooking(null)} disabled={Boolean(busy)} />
            </View> : <Button label="I cooked this" onPress={() => reviewCooking(meal.day)} disabled={Boolean(busy)} secondary />}
          </> : <Text style={styles.note}>Save this plan to track cooking and pantry usage.</Text>}
        </View>)}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Grocery list</Text>
          <Text style={styles.subtitle}>Combined shortages across all three dinners. Checkmarks last while this screen is open.</Text>
          {!plan.groceryList.length ? <Text style={styles.body}>Your pantry covers every listed ingredient.</Text> : plan.groceryList.map((item, index) => <TouchableOpacity key={index}
            accessibilityRole="checkbox" accessibilityState={{ checked: Boolean(checked[index]) }}
            onPress={() => setChecked(previous => ({ ...previous, [index]: !previous[index] }))} style={styles.grocery}>
            <Ionicons name={checked[index] ? "checkbox" : "square-outline"} color={GREEN} size={24} />
            <Text style={[styles.body, checked[index] && styles.checked]}>{amount(item.quantity)} {item.unit} {item.name}</Text>
          </TouchableOpacity>)}
          {plan.notes.map(note => <Text key={note} style={styles.note}>{note}</Text>)}
          {!current.savedAt ? <Button label={busy === "saving" ? "Saving…" : "Save plan & grocery list"} onPress={save} disabled={Boolean(busy)} /> : <Text style={styles.link}>Saved. Pantry quantities change only when you confirm a cooked dinner.</Text>}
        </View>
      </> : null}
      <Text style={styles.sectionTitle}>Recent saved plans</Text>
      {loading ? <ActivityIndicator color={GREEN} /> : null}
      {listError ? <View style={styles.card}><Text style={styles.error}>{listError}</Text><Button label="Retry saved plans" onPress={() => { setLoading(true); loadSaved(); }} disabled={loading || Boolean(busy)} secondary /></View> : null}
      {!loading && !listError && !saved.length ? <Text style={styles.subtitle}>Your saved plans will appear here.</Text> : null}
      {saved.map(entry => <Button key={entry.id} secondary disabled={Boolean(busy)} label={`${entry.plan.startDate} · ${entry.plan.servings} servings · ${entry.plan.meals[0].title}`}
        onPress={() => { setSavedMoment(0); setCurrent(entry); setChecked({}); setError(""); setCooking(null); }} />)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: E.background, borderRadius: 14, padding: 4 },
  stepButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  people: { color: E.ink, fontSize: 18, fontWeight: "600" },
  timeOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timeChip: { minHeight: 44, paddingHorizontal: 14, justifyContent: "center", borderRadius: 12, backgroundColor: E.sage },
  timeSelected: { backgroundColor: GREEN },
  customTime: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  page: { flex: 1, backgroundColor: E.background },
  header: { paddingHorizontal: 20, maxWidth: 740, width: "100%", alignSelf: "center" },
  back: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 14 },
  content: { padding: 20, paddingBottom: 48, gap: 16, maxWidth: 740, width: "100%", alignSelf: "center" },
  title: { fontFamily: editorialFont, fontSize: 30, color: GREEN },
  subtitle: { fontSize: 14, lineHeight: 21, color: E.muted, flexShrink: 1 },
  card: { padding: 20, gap: 12, backgroundColor: "white", borderRadius: 20, borderWidth: 1, borderColor: E.line },
  sectionTitle: { fontFamily: editorialFont, fontSize: 26, color: E.ink },
  label: { fontWeight: "700", color: E.ink, fontSize: 15, marginTop: 6 },
  input: { borderWidth: 1, borderColor: E.sage, padding: 12, minHeight: 48, borderRadius: 12, fontSize: 16, color: E.ink },
  button: { backgroundColor: GREEN, padding: 16, borderRadius: 14 },
  buttonText: { color: "white", fontWeight: "700", textAlign: "center", lineHeight: 22 },
  secondary: { backgroundColor: E.sage },
  green: { color: GREEN },
  disabled: { opacity: 0.5 },
  link: { color: GREEN, fontWeight: "700" },
  progress: { flexDirection: "row", gap: 12, alignItems: "center" },
  error: { backgroundColor: "#FFE8DF", color: "#A13C27", padding: 16, borderRadius: 12, lineHeight: 22 },
  banner: { backgroundColor: E.sage, borderRadius: 16, padding: 18, gap: 8 },
  eyebrow: { color: GREEN, fontSize: 12, fontWeight: "800" },
  reason: { backgroundColor: "#FFF2D8", padding: 12, borderRadius: 10, color: GREEN, lineHeight: 22 },
  body: { color: E.ink, fontSize: 15, lineHeight: 23, flexShrink: 1 },
  ingredient: { gap: 2 },
  grocery: { flexDirection: "row", gap: 12, alignItems: "center", paddingVertical: 10 },
  checked: { textDecorationLine: "line-through", color: E.muted },
  note: { color: E.muted, fontSize: 13, lineHeight: 20 },
});
