import PageEntrance from "../../components/motion/PageEntrance";
import TouchableOpacity from "../../components/motion/MotionPressable";
import { useClerk, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EDITORIAL_COLORS as E, EDITORIAL_FONT } from "../../constants/editorialTheme";

function Shortcut({ icon, title, detail, onPress }) {
  return <TouchableOpacity accessibilityRole="button" onPress={onPress} style={styles.row}>
    <View style={styles.icon}><Ionicons name={icon} size={22} color={E.green} /></View>
    <View style={styles.rowCopy}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.caption}>{detail}</Text></View>
    <Ionicons name="chevron-forward" size={18} color={E.muted} />
  </TouchableOpacity>;
}

function ProfileScreen() {
  const { user, isLoaded } = useUser();
  if (!isLoaded) return <SafeAreaView style={styles.page}><ActivityIndicator accessibilityLabel="Loading profile" color={E.green} /></SafeAreaView>;
  if (!user) return <SafeAreaView style={styles.page}><Text style={styles.caption}>Sign in to view your profile.</Text></SafeAreaView>;
  return <Profile key={user.id} user={user} />;
}

function Profile({ user }) {
  const router = useRouter();
  const { signOut } = useClerk();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const name = user.fullName || user.firstName || user.username || "Home cook";
  const initials = name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  const save = async () => {
    if (busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await user.update({ firstName: firstName.trim(), lastName: lastName.trim() });
      setEditing(false); setMessage("Your profile is updated.");
    } catch { setError("Could not update your name. Please try again."); }
    finally { setBusy(false); }
  };
  const leave = () => {
    const perform = async () => {
      setBusy(true); setError("");
      try { await signOut(); }
      catch { setError("Could not sign out. Please try again."); setBusy(false); }
    };
    if (Platform.OS === "web") { if (window.confirm("Sign out of Simmerli?")) perform(); }
    else Alert.alert("Sign out?", "Your saved recipes and pantry will be here when you return.", [
      { text: "Cancel", style: "cancel" }, { text: "Sign out", style: "destructive", onPress: perform },
    ]);
  };
  return <SafeAreaView style={styles.page} edges={["top", "left", "right"]}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>YOUR PERSONAL KITCHEN</Text>
      <Text style={styles.title}>A seat at your table.</Text>
      <View style={styles.identity}>
        <View style={styles.avatar}><Text style={styles.initials}>{initials}</Text></View>
        <View style={styles.rowCopy}><Text style={styles.name}>{name}</Text><Text selectable style={styles.caption}>{user.primaryEmailAddress?.emailAddress || "Signed in with your account"}</Text></View>
      </View>
      <View style={styles.card}>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Your details</Text>
          {!editing && <TouchableOpacity accessibilityRole="button" style={styles.edit} onPress={() => { setFirstName(user.firstName || ""); setLastName(user.lastName || ""); setEditing(true); setMessage(""); setError(""); }}><Text style={styles.link}>Edit name</Text></TouchableOpacity>}
        </View>
        {editing ? <View style={styles.form}>
          <Text style={styles.rowTitle}>First name</Text><TextInput accessibilityLabel="First name" value={firstName} onChangeText={setFirstName} editable={!busy} autoComplete="given-name" maxLength={100} style={styles.input} />
          <Text style={styles.rowTitle}>Last name</Text><TextInput accessibilityLabel="Last name" value={lastName} onChangeText={setLastName} editable={!busy} autoComplete="family-name" maxLength={100} style={styles.input} />
          <TouchableOpacity accessibilityRole="button" disabled={busy || !firstName.trim()} onPress={save} style={[styles.button, (busy || !firstName.trim()) && styles.disabled]}><Text style={styles.buttonText}>{busy ? "Saving…" : "Save name"}</Text></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.edit} onPress={() => setEditing(false)}><Text style={styles.link}>Cancel</Text></TouchableOpacity>
        </View> : <Text style={styles.caption}>Your account keeps your recipes, pantry, and cooking preferences together.</Text>}
      </View>
      {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
      {message ? <Text style={styles.caption} accessibilityLiveRegion="polite">{message}</Text> : null}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Made for you</Text>
        <Shortcut icon="heart-outline" title="Your cookbook" detail="Favorites and saved recipes" onPress={() => router.push("/(taps)/favorites")} />
        <Shortcut icon="basket-outline" title="Your pantry" detail="Keep track of what you have" onPress={() => router.push("/(taps)/pantry")} />
        <Shortcut icon="options-outline" title="Dinner plans & preferences" detail="Spice, ingredients to avoid, and saved plans" onPress={() => router.push("/meal-planner")} />
        {process.env.EXPO_PUBLIC_BETA_ENABLED === "true" && <Shortcut icon="sparkles-outline" title="AI usage" detail="View your remaining allowance" onPress={() => router.push("/membership")} />}
      </View>
      <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={leave} style={styles.signOut}><Ionicons name="log-out-outline" size={20} color={E.coral} /><Text style={styles.signOutText}>Sign out</Text></TouchableOpacity>
      <Text style={styles.footer}>simmerli. · A little inspiration for every table.</Text>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: E.background },
  content: { padding: 22, paddingBottom: 36, gap: 20, width: "100%", maxWidth: 740, alignSelf: "center" },
  eyebrow: { color: E.gold, fontSize: 11, fontWeight: "700", letterSpacing: 2, marginTop: 12 },
  title: { fontFamily: EDITORIAL_FONT, fontSize: 36, color: E.ink, lineHeight: 43 },
  identity: { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 8 },
  avatar: { width: 66, height: 66, borderRadius: 33, backgroundColor: E.green, alignItems: "center", justifyContent: "center" },
  initials: { fontFamily: EDITORIAL_FONT, fontSize: 25, color: E.white },
  name: { fontFamily: EDITORIAL_FONT, fontSize: 24, color: E.ink, marginBottom: 4 },
  caption: { color: E.muted, fontSize: 14, lineHeight: 21 },
  card: { padding: 18, gap: 12, backgroundColor: E.white, borderWidth: 1, borderColor: E.line, borderRadius: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" },
  sectionTitle: { fontFamily: EDITORIAL_FONT, fontSize: 23, color: E.ink },
  edit: { minHeight: 44, justifyContent: "center", paddingHorizontal: 8 },
  link: { color: E.green, fontWeight: "600" },
  form: { gap: 10 },
  input: { minHeight: 48, padding: 12, borderWidth: 1, borderColor: E.line, borderRadius: 12, fontSize: 16, color: E.ink },
  button: { backgroundColor: E.green, padding: 16, borderRadius: 14 },
  buttonText: { color: E.white, fontWeight: "700", textAlign: "center" },
  disabled: { opacity: 0.5 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 72, paddingVertical: 8 },
  rowCopy: { flex: 1, gap: 3, minWidth: 0 },
  rowTitle: { fontWeight: "600", fontSize: 15, color: E.ink },
  icon: { backgroundColor: E.sage, width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  error: { color: E.coral, lineHeight: 21 },
  signOut: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 48 },
  signOutText: { color: E.coral, fontWeight: "600" },
  footer: { color: E.muted, textAlign: "center", fontSize: 12, lineHeight: 18 },
});

export default function AnimatedProfileScreen() {
  return <PageEntrance><ProfileScreen /></PageEntrance>;
}
