import KitchenCompanion from "../../components/chef/KitchenCompanion";
import SuccessMoment from "../../components/motion/SuccessMoment";
import PageEntrance from "../../components/motion/PageEntrance";
import TouchableOpacity from "../../components/motion/MotionPressable";
import { EDITORIAL_COLORS as E, EDITORIAL_FONT as editorialFont } from "../../constants/editorialTheme";
import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../../constants/api";

import { expiryInfo, pantryList } from "../../services/kitchenLists";

const UNITS = ["items", "g", "kg", "ml", "l", "cups", "tbsp", "tsp"];
const EMPTY = { name: "", quantity: "1", unit: "items", expiresOn: "" };
const GREEN = "#245B4B";

function PantryScreen() {
  const { userId, isLoaded, getToken } = useAuth();
  // Remount account-specific state on sign-in changes.
  if (!isLoaded) return <View style={styles.center}><ActivityIndicator color={GREEN} /></View>;
  if (!userId) return <View style={styles.center}><Text style={styles.subtitle}>Sign in to save your pantry ingredients.</Text></View>;
  return <Pantry key={userId} getToken={getToken} />;
}

function Pantry({ getToken }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [saveMoment, setSaveMoment] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const scroll = useRef(null);
  const revision = useRef(0);
  const mutation = useRef(false);

  const request = useCallback(async (path = "", options = {}) => {
    const token = await getToken();
    if (!token) throw new Error("Please sign in again to access your pantry.");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${API_URL}/pantry${path}`, {
        ...options, signal: controller.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (response.status === 204) return null;
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Your pantry could not be loaded.");
      return data;
    } catch (failure) {
      if (failure.name === "AbortError") throw new Error("The request timed out. Please try again.");
      throw failure;
    } finally { clearTimeout(timeout); }
  }, [getToken]);

  const load = useCallback(async () => {
    if (mutation.current) return;
    const current = ++revision.current;
    setLoading(true);
    setError("");
    try {
      const data = await request();
      if (current === revision.current) setItems(data.items);
    } catch (failure) {
      if (current === revision.current) setError(failure.message);
    } finally {
      if (current === revision.current) setLoading(false);
    }
  }, [request]);

  useFocusEffect(useCallback(() => {
    load();
    return () => { revision.current += 1; };
  }, [load]));

  const resetForm = () => { setForm(EMPTY); setEditingId(null); setFormOpen(false); };
  const change = (key, value) => setForm(previous => ({ ...previous, [key]: value }));
  const save = async () => {
    if (mutation.current) return;
    if (!form.name.trim() || !Number.isFinite(Number(form.quantity)) || Number(form.quantity) <= 0) {
      setError("Enter an ingredient name and a positive quantity.");
      return;
    }
    await mutate(async () => {
      const data = await request(editingId ? `/${editingId}` : "", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify({ ...form, name: form.name.trim(), expiresOn: form.expiresOn.trim() || null }),
      });
      setItems(previous => editingId
        ? previous.map(item => item.id === editingId ? data.item : item)
        : [...previous, data.item]);
      setCelebrate(true); setSaveMoment(value => value + 1);
      setNotice(editingId ? "Ingredient updated." : "Ingredient added to your pantry.");
      resetForm();
    });
  };
  const mutate = async (action) => {
    if (mutation.current) return;
    mutation.current = true;
    revision.current += 1;
    setLoading(false);
    setBusy(true);
    setNotice(""); setCelebrate(false);
    setError("");
    try { await action(); }
    catch (failure) { setError(failure.message); }
    finally { mutation.current = false; setBusy(false); }
  };
  const remove = item => mutate(async () => {
    await request(`/${item.id}`, { method: "DELETE" });
    setItems(previous => previous.filter(entry => entry.id !== item.id));
    if (editingId === item.id) resetForm();
    setDeleteId(null);
    setNotice(`${item.name} removed.`);
  });
  const sorted = pantryList(items, query, filter);
  const counts = items.reduce((result, item) => {
    result[expiryInfo(item.expiresOn).group] += 1;
    return result;
  }, { soon: 0, past: 0, undated: 0, later: 0 });


  return (
    <SafeAreaView style={styles.page} edges={["top"]}>
      <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={GREEN} enabled={!busy} />}>
          <View style={styles.heading}>
            <View style={{ flex: 1 }}><Text style={styles.eyebrow}>YOUR EVERYDAY INGREDIENTS</Text><Text style={styles.title}>Good things.{"\n"}On your shelves.</Text></View>
            <View style={styles.heroIcon}><Ionicons name="basket-outline" size={28} color={GREEN} /></View>
          </View>
          <Text style={styles.subtitle}>See what’s on hand. Make something good.</Text>
          <View style={styles.overview}>
            {[['all', items.length, 'Ingredients'], ['soon', counts.soon, 'Due in 3 days'], ['past', counts.past, 'Past date']].map(([id, count, label]) =>
              <TouchableOpacity key={id} accessibilityRole="button" accessibilityLabel={`Show ${label.toLowerCase()}`} accessibilityState={{ selected: filter === id }} onPress={() => setFilter(id)} style={[styles.stat, filter === id && styles.statSelected]}>
                <Text style={styles.statNumber}>{loading && !items.length ? '—' : count}</Text><Text style={styles.statLabel}>{label}</Text>
              </TouchableOpacity>)}
          </View>
          <TouchableOpacity accessibilityRole="button" style={styles.planner} onPress={() => router.push("/meal-planner")}>
            <Ionicons name="sparkles-outline" size={24} color={GREEN} /><View style={{ flex: 1 }}><Text style={styles.plannerTitle}>Turn your pantry into dinner</Text><Text style={styles.small}>Build a meal plan around what you have.</Text></View><Ionicons name="arrow-forward" size={20} color={GREEN} />
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Scan ingredients from a photo" style={styles.planner} onPress={() => router.push("/scan-ingredients")}>
            <Ionicons name="camera-outline" size={26} color={GREEN} /><View style={{ flex: 1 }}><Text style={styles.plannerTitle}>Stock your pantry with a photo</Text><Text style={styles.small}>Scan ingredients, review, then add.</Text></View><Ionicons name="arrow-forward" size={20} color={GREEN} />
          </TouchableOpacity>
          <View style={styles.sectionRow}><Text style={styles.sectionTitle}>On your shelves</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Add ingredient" style={styles.addButton} disabled={busy} onPress={() => { resetForm(); setFormOpen(true); setError(""); }}><Ionicons name="add" size={18} color="white" /><Text style={styles.white}>Add item</Text></TouchableOpacity></View>
          {!!notice && (celebrate ? <SuccessMoment key={saveMoment} message={notice} /> : <Text style={styles.link} accessibilityLiveRegion="polite">{notice}</Text>)}
          {error ? <View style={styles.error} accessibilityLiveRegion="polite"><Text style={styles.errorText}>{error}</Text><TouchableOpacity onPress={load} disabled={busy}><Text style={styles.link}>Retry loading pantry</Text></TouchableOpacity></View> : null}
          {formOpen && <View style={styles.card}>
            <Text style={styles.sectionTitle}>{editingId ? "Edit ingredient" : "Add an ingredient"}</Text>
            <Text style={styles.label}>Ingredient</Text>
            <TextInput accessibilityLabel="Ingredient name" style={styles.input} placeholder="e.g. Spinach" value={form.name} onChangeText={value => change("name", value)} maxLength={100} editable={!busy} />
            <Text style={styles.label}>Quantity</Text>
            <TextInput accessibilityLabel="Quantity" style={styles.input} keyboardType="decimal-pad" value={form.quantity} onChangeText={value => change("quantity", value)} editable={!busy} />
            <Text style={styles.label}>Unit</Text>
            <View style={styles.units}>{UNITS.map(unit => <TouchableOpacity key={unit} accessibilityRole="button" accessibilityState={{ selected: form.unit === unit }} disabled={busy} onPress={() => change("unit", unit)} style={[styles.chip, form.unit === unit && styles.selected]}><Text style={form.unit === unit ? styles.white : styles.link}>{unit}</Text></TouchableOpacity>)}</View>
            <Text style={styles.label}>Expiry date · optional</Text>
            <TextInput accessibilityLabel="Expiry date, YYYY-MM-DD" style={styles.input} placeholder="YYYY-MM-DD" autoCapitalize="none" maxLength={10} value={form.expiresOn} onChangeText={value => change("expiresOn", value)} editable={!busy} />
            <TouchableOpacity accessibilityRole="button" style={[styles.button, busy && styles.disabled]} onPress={save} disabled={busy}><Text style={styles.white}>{busy ? "Saving…" : editingId ? "Save changes" : "Add to pantry"}</Text></TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" style={styles.cancel} onPress={resetForm} disabled={busy}><Text style={styles.link}>Cancel</Text></TouchableOpacity>
          </View>}
          <View style={styles.search}><Ionicons name="search-outline" size={20} color={GREEN} /><TextInput accessibilityLabel="Search pantry" placeholder="Find an ingredient…" placeholderTextColor={E.muted} value={query} onChangeText={setQuery} style={styles.searchInput} /></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {[["all", "All items"], ["soon", "Due soon"], ["past", "Past date"], ["undated", "No date"]].map(([id, label]) => <TouchableOpacity key={id} accessibilityRole="button" accessibilityState={{ selected: filter === id }} onPress={() => setFilter(id)} style={[styles.chip, filter === id && styles.selected]}><Text style={filter === id ? styles.white : styles.link}>{label}</Text></TouchableOpacity>)}
          </ScrollView>
          <Text style={styles.small}>{sorted.length} ingredient{sorted.length === 1 ? "" : "s"} · Earliest dates first</Text>
          {!loading && items.length > 0 && !sorted.length && <View style={styles.card}><Text style={styles.itemName}>Nothing on this shelf yet</Text><Text style={styles.subtitle}>Try another search or filter.</Text><TouchableOpacity accessibilityRole="button" style={styles.cancel} onPress={() => { setQuery(""); setFilter("all"); }}><Text style={styles.link}>Show all ingredients</Text></TouchableOpacity></View>}
          {!loading && !error && !items.length ? <View style={styles.card}><KitchenCompanion size={58} /><Text style={styles.subtitle}>Start with a few everyday staples. Tap Add item to put your first ingredient on the shelf.</Text></View> : null}
          {sorted.map(item => <View key={item.id} style={styles.card}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.subtitle}>{Number(item.quantity)} {item.unit}</Text>
            <View style={[styles.expiry, expiryInfo(item.expiresOn).group === "past" && { backgroundColor: "#FBE6E0" }, expiryInfo(item.expiresOn).group === "later" && { backgroundColor: "#EAF2ED" }]}><Ionicons name="calendar-outline" size={16} color={GREEN} /><Text style={styles.expiryText}>{expiryInfo(item.expiresOn).label}</Text></View>
            <View style={styles.actions}>
              <TouchableOpacity accessibilityRole="button" style={styles.actionButton} disabled={busy} accessibilityLabel={`Edit ${item.name}`} onPress={() => { setFormOpen(true); setEditingId(item.id); setForm({ name: item.name, quantity: String(Number(item.quantity)), unit: item.unit, expiresOn: item.expiresOn || "" }); setError(""); scroll.current?.scrollTo({ y: 0, animated: true }); }}><Text style={styles.link}>Edit</Text></TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" style={styles.actionButton} disabled={busy} accessibilityLabel={`Remove ${item.name}`} onPress={() => setDeleteId(item.id)}><Text style={styles.errorText}>Remove</Text></TouchableOpacity>
            </View>
            {deleteId === item.id ? <View style={styles.confirm}><Text>Remove {item.name} from your pantry?</Text><View style={styles.actions}><TouchableOpacity accessibilityRole="button" style={styles.actionButton} disabled={busy} onPress={() => remove(item)}><Text style={styles.errorText}>Yes, remove</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" style={styles.actionButton} disabled={busy} onPress={() => setDeleteId(null)}><Text style={styles.link}>Keep it</Text></TouchableOpacity></View></View> : null}
          </View>)}
          <Text style={styles.small}>Dates reflect the labels you enter; they don’t determine food safety.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: E.gold, fontSize: 9, letterSpacing: 1.6, fontWeight: "700", marginBottom: 10 },
  heroIcon: { backgroundColor: E.sage, width: 54, height: 54, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  overview: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, borderWidth: 1, borderColor: E.line, borderRadius: 18, paddingVertical: 17, paddingHorizontal: 10, backgroundColor: "white", minHeight: 90 },
  statSelected: { borderColor: GREEN, backgroundColor: "#EAF2ED" },
  statNumber: { color: GREEN, fontSize: 27, fontWeight: "800" },
  statLabel: { color: "#52665C", fontSize: 11, marginTop: 5 },
  planner: { backgroundColor: E.sage, borderRadius: 20, padding: 18, flexDirection: "row", gap: 12, alignItems: "center" },
  plannerTitle: { fontFamily: editorialFont, color: E.ink, fontSize: 21, marginBottom: 5 },
  small: { color: E.muted, fontSize: 12, lineHeight: 18 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 8 },
  addButton: { backgroundColor: GREEN, borderRadius: 13, minHeight: 44, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 5 },
  search: { backgroundColor: "white", borderWidth: 1, borderColor: E.line, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14 },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 15, fontSize: 15, color: E.ink },
  filters: { gap: 8 },
  page: { flex: 1, backgroundColor: E.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: E.background },
  content: { padding: 20, gap: 16, paddingBottom: 40, maxWidth: 700, width: "100%", alignSelf: "center" },
  heading: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontFamily: editorialFont, color: GREEN, fontSize: 37, lineHeight: 43, letterSpacing: -0.8, },
  subtitle: { color: E.muted, fontSize: 15, lineHeight: 23 },
  card: { backgroundColor: "white", borderRadius: 20, padding: 18, borderWidth: 1, borderColor: E.line, gap: 10 },
  sectionTitle: { fontFamily: editorialFont, color: E.ink, fontSize: 25, },
  label: { color: E.ink, fontWeight: "600", marginTop: 4 },
  input: { borderWidth: 1, borderColor: E.sage, borderRadius: 12, padding: 12, fontSize: 16, color: E.ink, minHeight: 48 },
  units: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: E.sage, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  selected: { backgroundColor: GREEN },
  white: { color: "white", fontWeight: "700", textAlign: "center" },
  button: { backgroundColor: GREEN, padding: 16, borderRadius: 14, marginTop: 6 },
  disabled: { opacity: 0.5 },
  cancel: { alignItems: "center", padding: 10 },
  link: { color: GREEN, fontWeight: "700" },
  error: { backgroundColor: "#FFE8DF", padding: 16, borderRadius: 14, gap: 12 },
  errorText: { color: "#A13C27", fontWeight: "600" },
  itemName: { fontFamily: editorialFont, color: E.ink, fontSize: 22, },
  expiry: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFF2D8", padding: 10, borderRadius: 10 },
  expiryText: { color: GREEN, flexShrink: 1 },
  actionButton: { minHeight: 44, minWidth: 44, justifyContent: "center" },
  actions: { flexDirection: "row", gap: 28, minHeight: 44, alignItems: "center", paddingVertical: 12 },
  confirm: { borderTopWidth: 1, borderColor: E.line, paddingTop: 12 },
});

export default function AnimatedPantryScreen() {
  return <PageEntrance><PantryScreen /></PageEntrance>;
}
