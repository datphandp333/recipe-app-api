import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../../constants/api";

const UNITS = ["items", "g", "kg", "ml", "l", "cups", "tbsp", "tsp"];
const EMPTY = { name: "", quantity: "1", unit: "items", expiresOn: "" };
const GREEN = "#245B4B";

function expiryLabel(value) {
  if (!value) return "No expiry date";
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((Date.parse(`${value}T00:00:00Z`) - today) / 86400000);
  if (days < 0) return `Past expiry · ${value}`;
  if (days === 0) return "Expires today";
  if (days <= 3) return `Use soon · ${days} day${days === 1 ? "" : "s"} left`;
  return `Expires ${value}`;
}

export default function PantryScreen() {
  const { userId, isLoaded, getToken } = useAuth();
  // Remount account-specific state on sign-in changes.
  if (!isLoaded) return <View style={styles.center}><ActivityIndicator color={GREEN} /></View>;
  if (!userId) return <View style={styles.center}><Text style={styles.subtitle}>Sign in to save your pantry ingredients.</Text></View>;
  return <Pantry key={userId} getToken={getToken} />;
}

function Pantry({ getToken }) {
  const router = useRouter();
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

  const resetForm = () => { setForm(EMPTY); setEditingId(null); };
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
      resetForm();
    });
  };
  const mutate = async (action) => {
    if (mutation.current) return;
    mutation.current = true;
    revision.current += 1;
    setLoading(false);
    setBusy(true);
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
  });
  const sorted = [...items].sort((a, b) => (a.expiresOn || "9999").localeCompare(b.expiresOn || "9999") || a.name.localeCompare(b.name));

  return (
    <SafeAreaView style={styles.page} edges={["top"]}>
      <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={GREEN} enabled={!busy} />}>
          <View style={styles.heading}><Ionicons name="basket-outline" size={32} color={GREEN} /><Text style={styles.title}>My pantry</Text></View>
          <Text style={styles.subtitle}>Know what you have. Use what expires first.</Text>
          <TouchableOpacity accessibilityRole="button" style={styles.button} onPress={() => router.push("/meal-planner")}>
            <Text style={styles.white}>Plan dinners</Text>
          </TouchableOpacity>
          {error ? <View style={styles.error} accessibilityLiveRegion="polite"><Text style={styles.errorText}>{error}</Text><TouchableOpacity onPress={load} disabled={busy}><Text style={styles.link}>Retry loading pantry</Text></TouchableOpacity></View> : null}
          <View style={styles.card}>
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
            {editingId ? <TouchableOpacity style={styles.cancel} onPress={resetForm} disabled={busy}><Text style={styles.link}>Cancel editing</Text></TouchableOpacity> : null}
          </View>
          <Text style={styles.sectionTitle}>Your ingredients · {items.length}</Text>
          {!loading && !error && !items.length ? <View style={styles.card}><Text style={styles.subtitle}>Your pantry is ready to fill. Add your first ingredient above.</Text></View> : null}
          {sorted.map(item => <View key={item.id} style={styles.card}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.subtitle}>{Number(item.quantity)} {item.unit}</Text>
            <View style={styles.expiry}><Ionicons name="calendar-outline" size={16} color={GREEN} /><Text style={styles.expiryText}>{expiryLabel(item.expiresOn)}</Text></View>
            <View style={styles.actions}>
              <TouchableOpacity disabled={busy} accessibilityLabel={`Edit ${item.name}`} onPress={() => { setEditingId(item.id); setForm({ name: item.name, quantity: String(Number(item.quantity)), unit: item.unit, expiresOn: item.expiresOn || "" }); setError(""); scroll.current?.scrollTo({ y: 0, animated: true }); }}><Text style={styles.link}>Edit</Text></TouchableOpacity>
              <TouchableOpacity disabled={busy} accessibilityLabel={`Remove ${item.name}`} onPress={() => setDeleteId(item.id)}><Text style={styles.errorText}>Remove</Text></TouchableOpacity>
            </View>
            {deleteId === item.id ? <View style={styles.confirm}><Text>Remove {item.name} from your pantry?</Text><View style={styles.actions}><TouchableOpacity disabled={busy} onPress={() => remove(item)}><Text style={styles.errorText}>Yes, remove</Text></TouchableOpacity><TouchableOpacity disabled={busy} onPress={() => setDeleteId(null)}><Text style={styles.link}>Keep it</Text></TouchableOpacity></View></View> : null}
          </View>)}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FFF8F0" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#FFF8F0" },
  content: { padding: 20, gap: 16, paddingBottom: 40, maxWidth: 700, width: "100%", alignSelf: "center" },
  heading: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { color: GREEN, fontSize: 30, fontWeight: "800" },
  subtitle: { color: "#66736D", fontSize: 15, lineHeight: 23 },
  card: { backgroundColor: "white", borderRadius: 20, padding: 18, borderWidth: 1, borderColor: "#E8DED1", gap: 10 },
  sectionTitle: { color: GREEN, fontSize: 20, fontWeight: "700" },
  label: { color: "#20302A", fontWeight: "600", marginTop: 4 },
  input: { borderWidth: 1, borderColor: "#DDEDE5", borderRadius: 12, padding: 12, fontSize: 16, color: "#20302A", minHeight: 48 },
  units: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: "#DDEDE5", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  selected: { backgroundColor: GREEN },
  white: { color: "white", fontWeight: "700", textAlign: "center" },
  button: { backgroundColor: GREEN, padding: 16, borderRadius: 14, marginTop: 6 },
  disabled: { opacity: 0.5 },
  cancel: { alignItems: "center", padding: 10 },
  link: { color: GREEN, fontWeight: "700" },
  error: { backgroundColor: "#FFE8DF", padding: 16, borderRadius: 14, gap: 12 },
  errorText: { color: "#A13C27", fontWeight: "600" },
  itemName: { color: "#20302A", fontSize: 19, fontWeight: "700" },
  expiry: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFF2D8", padding: 10, borderRadius: 10 },
  expiryText: { color: GREEN, flexShrink: 1 },
  actions: { flexDirection: "row", gap: 28, paddingVertical: 12 },
  confirm: { borderTopWidth: 1, borderColor: "#E8DED1", paddingTop: 12 },
});
