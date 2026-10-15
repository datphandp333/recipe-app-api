import Pressable from "../components/motion/MotionPressable";
import { useAuth } from '@clerk/expo';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator,  ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../constants/api';

const LABELS = { chat: 'Chef chat messages', recipes: 'Create or adapt recipes', scans: 'Ingredient photo scans', plans: 'Generate meal plans' };
export default function MembershipScreen() {
  const { userId, getToken } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const sequence = useRef(0);
  const tokenGetter = useRef(getToken);
  useLayoutEffect(() => { tokenGetter.current = getToken; }, [getToken]);
  const enabled = process.env.EXPO_PUBLIC_BETA_ENABLED === 'true';
  const load = useCallback(async () => {
    const request = ++sequence.current;
    setBusy(true); setError(''); setStatus(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const token = await tokenGetter.current();
      if (!userId || !token) throw new Error('Sign in to view your beta usage.');
      const response = await fetch(`${API_URL}/membership`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Usage could not be loaded.');
      if (request === sequence.current) setStatus(data);
    } catch (failure) { if (request === sequence.current) setError(failure.name === 'AbortError' ? 'Usage took too long to load. Please try again.' : failure.message); }
    finally { clearTimeout(timeout); if (request === sequence.current) setBusy(false); }
  }, [userId]);
  useFocusEffect(useCallback(() => { if (enabled) load(); return () => { sequence.current++; }; }, [enabled, load]));
  if (!enabled || status?.plan === 'testing') return <SafeAreaView style={s.page}><View style={s.content}>
    <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" style={s.back}><Ionicons name="arrow-back" size={24} color="#245B4B" /></Pressable>
    <Text style={s.title}>App testing</Text><Text style={s.text}>Beta limits are paused while you test Simmerli. No membership or payment is required.</Text>
  </View></SafeAreaView>;
  return <SafeAreaView style={s.page}><ScrollView contentContainerStyle={s.content}>
    <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" style={s.back}>
      <Ionicons name="arrow-back" size={24} color="#245B4B" />
    </Pressable>
    <Text style={s.eyebrow}>SIMMERLI BETA</Text>
    <Text style={s.title}>Your kitchen, for free</Text>
    <Text style={s.text}>No payment required. Explore country dishes, keep your favorites, and manage your pantry for free.</Text>
    <View style={s.card}>
      <Text style={s.heading}>Monthly AI allowance</Text>
      <Text style={s.text}>These limits help us keep the beta free. Unused allowance does not roll over.</Text>
      {busy && <ActivityIndicator color="#245B4B" accessibilityLabel="Loading beta usage" />}
      {!!error && <><Text style={s.error}>{error}</Text><Pressable style={s.button} onPress={load}><Text style={s.buttonText}>Try again</Text></Pressable></>}
      {status && <>
        {Object.entries(LABELS).map(([feature, label]) => {
          const allowance = status.allowances[feature];
          return <View style={s.row} key={feature}>
            <Text style={s.label}>{label}</Text><Text style={s.count}>{allowance.remaining} / {allowance.limit} left</Text>
          </View>;
        })}
        <Text style={s.text}>Resets {new Date(status.resetsAt).toLocaleString()}</Text>
      </>}
    </View>
    <Text style={s.text}>A chat reply uses one message. Creating a final recipe uses one recipe creation instead. Failed requests do not use your allowance. Saved content remains available when you reach a limit.</Text>
  </ScrollView></SafeAreaView>;
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFF8F0' }, content: { padding: 22, gap: 18 },
  back: { padding: 10, alignSelf: 'flex-start' }, eyebrow: { color: '#B94C34', fontWeight: '800', letterSpacing: 1 },
  title: { fontSize: 30, fontWeight: '800', color: '#173E33' }, text: { fontSize: 15, lineHeight: 23, color: '#65736B' },
  heading: { fontSize: 20, fontWeight: '700', color: '#20302A' }, card: { backgroundColor: 'white', padding: 20, borderRadius: 20, gap: 14 },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E9E1D7' },
  label: { flex: 1, color: '#20302A', fontSize: 15 }, count: { color: '#245B4B', fontWeight: '700', fontSize: 15 },
  error: { color: '#B94C34' }, button: { backgroundColor: '#245B4B', borderRadius: 12, padding: 14 }, buttonText: { color: 'white', textAlign: 'center', fontWeight: '700' },
});
