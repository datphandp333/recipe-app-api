import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const DEFAULTS = { householdSize: 2, spiceLevel: "any", dislikedIngredients: [], notes: "" };
const toForm = value => ({ ...value, householdSize: String(value.householdSize), dislikedIngredients: value.dislikedIngredients.join(", ") });
export default function CookingPreferences({ request, onSaved, onSaving, disabled, suggestedNote, clearSuggestion }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    request("/preferences").then(data => {
      if (active) { setForm(toForm(data.preferences)); onSaved(data.preferences); setError(""); }
    }).catch(failure => { if (active) setError(failure.message); });
    return () => { active = false; };
  }, [request, onSaved, reload]);
  const change = (key, value) => { setForm(previous => ({ ...previous, [key]: value })); setMessage("Unsaved changes"); };
  const save = async () => {
    if (saving) return;
    setSaving(true); onSaving(true); setError(""); setMessage("");
    try {
      const body = { ...form, householdSize: Number(form.householdSize),
        dislikedIngredients: form.dislikedIngredients.split(",").map(value => value.trim()).filter(Boolean) };
      const data = await request("/preferences", body, "PUT");
      setForm(toForm(data.preferences)); onSaved(data.preferences); setMessage("Preferences saved for future plans.");
    } catch (failure) { setError(failure.message); }
    finally { setSaving(false); onSaving(false); }
  };
  return <View style={styles.card}>
    <Text style={styles.title}>Cooking preferences</Text>
    <Text style={styles.help}>You control what is remembered. Save changes before generating a new plan.</Text>
    {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
    {!form ? error ? <TouchableOpacity onPress={() => setReload(value => value + 1)}><Text style={styles.label}>Retry preferences</Text></TouchableOpacity> : <ActivityIndicator color="#245B4B" /> : <>
      <Text style={styles.label}>Household size · default servings</Text>
      <TextInput accessibilityLabel="Default household size" style={styles.input} keyboardType="number-pad" maxLength={1} value={form.householdSize} editable={!disabled && !saving} onChangeText={value => change("householdSize", value)} />
      <Text style={styles.label}>Spice level</Text>
      <View style={styles.row}>{["any", "none", "mild", "medium", "hot"].map(level => <TouchableOpacity key={level} accessibilityRole="button" accessibilityState={{ selected: form.spiceLevel === level }}
        disabled={disabled || saving} style={[styles.chip, form.spiceLevel === level && styles.selected]} onPress={() => change("spiceLevel", level)}>
        <Text style={form.spiceLevel === level ? styles.white : styles.label}>{level === "any" ? "No preference" : level}</Text>
      </TouchableOpacity>)}</View>
      <Text style={styles.label}>Disliked ingredients · separated by commas</Text>
      <TextInput accessibilityLabel="Disliked ingredients" style={styles.input} value={form.dislikedIngredients} editable={!disabled && !saving} onChangeText={value => change("dislikedIngredients", value)} placeholder="e.g. mushrooms, olives" maxLength={1200} />
      <Text style={styles.help}>These are taste preferences, not an allergy-safety filter. Review each recipe.</Text>
      <Text style={styles.help}>Olives and olive oil are separate preferences. List both if you want to avoid both.</Text>
      <Text style={styles.label}>Cooking notes · optional</Text>
      <TextInput accessibilityLabel="Remembered cooking notes" multiline style={styles.input} maxLength={500} value={form.notes} editable={!disabled && !saving} onChangeText={value => change("notes", value)} placeholder="e.g. Prefer one-pot meals and less salt" />
      {suggestedNote ? <View style={styles.suggestion}>
        <Text style={styles.help}>Feedback to remember: {suggestedNote}</Text>
        <TouchableOpacity disabled={disabled || saving} onPress={() => {
          const combined = [form.notes, suggestedNote].filter(Boolean).join("\n");
          if (combined.length > 500) { setError("Shorten your notes before adding this feedback (500 characters maximum)."); return; }
          change("notes", combined); clearSuggestion();
        }}><Text style={styles.label}>Add to notes for review</Text></TouchableOpacity>
        <TouchableOpacity disabled={disabled || saving} onPress={clearSuggestion}><Text style={styles.help}>Dismiss</Text></TouchableOpacity>
      </View> : null}
      <TouchableOpacity accessibilityRole="button" disabled={disabled || saving} style={[styles.button, (disabled || saving) && styles.disabled]} onPress={save}><Text style={styles.white}>{saving ? "Saving…" : "Save preferences"}</Text></TouchableOpacity>
      <TouchableOpacity disabled={disabled || saving} onPress={() => { setForm(toForm(DEFAULTS)); setMessage("Defaults restored in the form. Save to clear remembered preferences."); }}><Text style={styles.label}>Reset form to defaults</Text></TouchableOpacity>
      {message ? <Text accessibilityLiveRegion="polite" style={styles.help}>{message}</Text> : null}
    </>}
  </View>;
}
const styles = StyleSheet.create({
  card: { padding: 20, gap: 12, backgroundColor: "white", borderRadius: 20, borderWidth: 1, borderColor: "#E8DED1" },
  title: { color: "#245B4B", fontSize: 21, fontWeight: "700" },
  label: { color: "#245B4B", fontWeight: "700", lineHeight: 21 },
  help: { color: "#66736D", fontSize: 14, lineHeight: 21 },
  input: { borderWidth: 1, borderColor: "#DDEDE5", borderRadius: 12, padding: 12, minHeight: 48, fontSize: 16, color: "#20302A" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: "#DDEDE5", padding: 12, borderRadius: 12 },
  selected: { backgroundColor: "#245B4B" },
  white: { color: "white", fontWeight: "700", textAlign: "center" },
  button: { backgroundColor: "#245B4B", padding: 16, borderRadius: 14 },
  disabled: { opacity: 0.5 },
  error: { color: "#A13C27", lineHeight: 21 },
  suggestion: { backgroundColor: "#FFF2D8", padding: 12, borderRadius: 12, gap: 10 },
});
