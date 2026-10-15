import { EDITORIAL_COLORS as E, EDITORIAL_FONT as editorialFont } from "../constants/editorialTheme";
import { betaFetch } from "../services/betaRequest";
import { useAuth } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../constants/api';
import IngredientPicture from '../components/IngredientPicture';
import { backOrReplace } from '../services/navigation';
import { confirmedItems, reviewItems, scanChefPrompt, scanRequestError, SCAN_UNITS } from '../services/ingredientScan';

export default function IngredientScanScreen() {
  const { userId, isLoaded, getToken } = useAuth();
  if (!isLoaded) return <View style={s.center}><ActivityIndicator color="#245B4B" /></View>;
  if (!userId) return <View style={s.center}><Text>Sign in to scan ingredients.</Text></View>;
  return <Scanner key={userId} getToken={getToken} />;
}
function Scanner({ getToken }) {
  const router = useRouter();
  const [photo, setPhoto] = useState(null);
  const [items, setItems] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const lock = useRef(false);
  const controller = useRef(null);
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; controller.current?.abort(); }; }, []);
  const request = async (path, body, duration = 15000) => {
    const token = await getToken();
    if (!active.current) throw new Error('Screen closed.');
    if (!token) throw new Error('Sign in again to continue.');
    const abort = new AbortController(); controller.current = abort;
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; abort.abort(); }, duration);
    try {
      const response = await betaFetch(`${API_URL}/pantry${path}`, { method: 'POST', signal: abort.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      const data = await response.json().catch(() => null);
      if (abort.signal.aborted) throw new Error('Request aborted.');
      if (!response.ok) throw new Error(data?.message || 'This request could not be completed.');
      return data;
    } catch (failure) {
      throw scanRequestError(failure, { timedOut, aborted: abort.signal.aborted });
    } finally { clearTimeout(timeout); if (controller.current === abort) controller.current = null; }
  };
  const pick = async camera => {
    if (lock.current) return;
    lock.current = true; setBusy('Preparing photo…'); setError('');
    try {
      if (camera && Platform.OS !== 'web') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) throw new Error('Camera access is off. Enable it in Settings or choose a photo instead.');
      }
      const result = await (camera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync)({ mediaTypes: ['images'], quality: 0.8, allowsMultipleSelection: false });
      if (result.canceled || !active.current) return;
      const asset = result.assets[0];
      const context = ImageManipulator.manipulate(asset.uri);
      context.resize(asset.width >= asset.height ? { width: Math.min(asset.width, 1280) } : { height: Math.min(asset.height, 1280) });
      const rendered = await context.renderAsync();
      const image = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.75, base64: true });
      if (!image.base64 || image.base64.length > 4 * 1024 * 1024) throw new Error('This photo is too large. Try a closer photo with fewer ingredients.');
      if (active.current) { setPhoto(image); setItems(null); setNotice(''); }
    } catch (failure) { if (active.current) setError(failure.message || 'Could not open the camera. Choose a photo instead.'); }
    finally { lock.current = false; if (active.current) setBusy(''); }
  };
  const scan = async () => {
    if (!photo || lock.current) return;
    lock.current = true; setBusy('Looking for ingredients…'); setError('');
    try {
      const result = await request('/scan', { image: photo.base64, mimeType: 'image/jpeg' }, 55000);
      if (!Array.isArray(result?.ingredients)) throw new Error('The scan response could not be read. Please try again.');
      if (active.current) setItems(reviewItems(result.ingredients));
    } catch (failure) { if (active.current) setError(failure.name === 'AbortError' ? 'Scan canceled or timed out. You can try again.' : failure.message); }
    finally { lock.current = false; if (active.current) setBusy(''); }
  };
  const change = (id, patch) => setItems(previous => previous.map(item => item.id === id ? { ...item, ...patch } : item));
  const save = async () => {
    if (lock.current) return;
    let selected;
    try { selected = confirmedItems(items || []); } catch (failure) { setError(failure.message); return; }
    lock.current = true; setBusy('Adding to pantry…'); setError(''); setNotice('');
    let count = 0;
    try {
      for (const item of selected) {
        if (!active.current) break;
        const { id, ...payload } = item;
        try {
          await request('', payload);
          if (active.current) change(id, { status: 'saved' });
          count += 1;
        } catch (failure) {
          // A lost response may follow a successful insert: don't blindly retry and duplicate it.
          if (active.current) { change(id, { status: 'check' }); setError(`${failure.message || 'Connection lost.'} Check Pantry for ${item.name} before adding it again.`); }
          break;
        }
      }
      if (active.current && count) setNotice(`${count} ingredient${count === 1 ? '' : 's'} added. Saved rows won’t be added again.`);
    } finally { lock.current = false; if (active.current) setBusy(''); }
  };
  const chef = () => {
    try { router.push({ pathname: '/ai-recipe', params: { prompt: scanChefPrompt(items || []) } }); }
    catch (failure) { setError(failure.message); }
  };
  const reset = () => { setPhoto(null); setItems(null); setError(''); setNotice(''); };
  const selectedCount = (items || []).filter(item => item.selected && item.status === 'pending').length;
  return <SafeAreaView style={s.page} edges={['top', 'left', 'right']}><KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.row}><Pressable accessibilityRole="button" accessibilityLabel="Back to pantry" disabled={!!busy} onPress={() => backOrReplace(router, '/(taps)/pantry')} style={s.icon}><Ionicons name="arrow-back" size={24} color="#245B4B" /></Pressable><Text style={s.eyebrow}>PHOTO TO PANTRY</Text></View>
      <Text style={s.title}>{items ? 'A quick check,\nthen into your kitchen.' : 'What’s in your kitchen?'}</Text>
      <Text style={s.body}>Photograph a few ingredients or readable food labels. You’ll review everything before it is saved.</Text>
      {!photo && <View style={s.placeholder}><Ionicons name="camera-outline" size={56} color="#245B4B" /><Text style={s.section}>A little less typing.</Text><Text style={s.body}>Use good light and keep ingredients separate.</Text></View>}
      {photo && <Image source={{ uri: photo.uri }} style={s.photo} contentFit="contain" accessibilityLabel="Selected ingredient photo" />}
      {!items && <View style={s.row}><Button label="Take photo" disabled={!!busy} onPress={() => pick(true)} /><Button label="Choose photo" secondary disabled={!!busy} onPress={() => pick(false)} /></View>}
      {photo && items === null && <><Text style={s.small}>Analyze photo sends this image to Google Gemini to suggest ingredient names. Our app does not save the photo to your pantry.</Text><Button label="Analyze photo" disabled={!!busy} onPress={scan} /></>}
      {!!busy && <View style={s.row}><ActivityIndicator color="#245B4B" /><Text style={s.body}>{busy}</Text>{busy === 'Looking for ingredients…' && <Pressable accessibilityRole="button" onPress={() => controller.current?.abort()} style={s.icon}><Text style={s.link}>Cancel</Text></Pressable>}</View>}
      {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      {!!notice && <Text accessibilityLiveRegion="polite" style={s.link}>{notice}</Text>}
      {items !== null && <>
        <Text style={s.section}>{items.length ? 'Review your ingredients' : 'No ingredients recognized'}</Text>
        <Text style={s.body}>{items.length ? 'Correct the names, deselect mistakes, and enter quantities yourself. The photo cannot reliably determine amounts or expiry dates.' : 'Try a brighter, closer photo, or add ingredients manually in Pantry.'}</Text>
        {items.map(item => <View key={item.id} style={s.card}>
          <View style={s.row}><Pressable accessibilityRole="checkbox" accessibilityLabel={`Select ${item.name}`} accessibilityState={{ checked: item.selected, disabled: !!busy || item.status !== 'pending' }} disabled={!!busy || item.status !== 'pending'} onPress={() => change(item.id, { selected: !item.selected })} style={s.icon}><Ionicons name={item.selected ? 'checkbox' : 'square-outline'} size={26} color="#245B4B" /></Pressable><IngredientPicture ingredient={item} style={{ width: 58, height: 58 }} /><View style={{ flex: 1 }}><Text style={s.small}>{item.status === 'saved' ? 'Added to pantry' : item.status === 'check' ? 'Check Pantry before retrying' : item.uncertain ? 'AI is unsure · check this' : 'AI suggestion · please confirm'}</Text></View></View>
          <TextInput accessibilityLabel={`Ingredient name ${Number(item.id) + 1}`} value={item.name} editable={!busy && item.status === 'pending'} maxLength={100} onChangeText={name => change(item.id, { name })} style={s.input} />
          <TextInput accessibilityLabel={`Quantity for ${item.name}`} placeholder="Enter quantity" keyboardType="decimal-pad" value={item.quantity} editable={!busy && item.status === 'pending'} onChangeText={quantity => change(item.id, { quantity })} style={s.input} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{SCAN_UNITS.map(unit => <Pressable key={unit} accessibilityRole="button" accessibilityLabel={`${unit} for ${item.name}`} accessibilityState={{ selected: item.unit === unit }} disabled={!!busy || item.status !== 'pending'} onPress={() => change(item.id, { unit })} style={[s.unit, item.unit === unit && { backgroundColor: '#245B4B' }]}><Text style={{ color: item.unit === unit ? 'white' : '#245B4B' }}>{unit}</Text></Pressable>)}</ScrollView>
        </View>)}
        {!!items.length && <><Button label={`Add ${selectedCount} to pantry`} disabled={!!busy || !selectedCount} onPress={save} /><Button label="Discuss with Chef" secondary disabled={!!busy} onPress={chef} /></>}
        <Button label="Open Pantry" secondary disabled={!!busy} onPress={() => router.replace('/(taps)/pantry')} />
      </>}
      {photo && <Button label="Start over" secondary disabled={!!busy} onPress={reset} />}
    </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
function Button({ label, onPress, disabled, secondary }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} onPress={onPress} disabled={disabled} style={[s.button, secondary && { backgroundColor: E.sage }, disabled && { opacity: 0.5 }]}><Text style={{ color: secondary ? '#245B4B' : 'white', fontWeight: '700', textAlign: 'center' }}>{label}</Text></Pressable>;
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: E.background }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { width: '100%', maxWidth: 700, alignSelf: 'center', padding: 20, paddingBottom: 50, gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }, icon: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: E.gold, fontSize: 9, fontWeight: '700', letterSpacing: 1.6 }, title: { fontFamily: editorialFont, color: E.ink, fontSize: 36, lineHeight: 42, },
  body: { color: E.muted, fontSize: 14, lineHeight: 21 }, small: { color: E.muted, fontSize: 12, lineHeight: 18 }, section: { fontFamily: editorialFont, color: '#245B4B', fontSize: 21, },
  placeholder: { padding: 30, minHeight: 210, backgroundColor: E.sage, borderRadius: 22, alignItems: 'center', justifyContent: 'center', gap: 12 }, photo: { width: '100%', height: 240, borderRadius: 20, backgroundColor: E.sage },
  button: { backgroundColor: '#245B4B', borderRadius: 14, padding: 16, minHeight: 48 }, card: { backgroundColor: 'white', borderWidth: 1, borderColor: E.line, borderRadius: 18, padding: 16, gap: 12 },
  input: { borderWidth: 1, borderColor: E.sage, padding: 12, borderRadius: 12, minHeight: 48, color: E.ink, fontSize: 16 }, unit: { minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 12, backgroundColor: E.sage },
  error: { color: E.gold, backgroundColor: '#FBE6E0', padding: 15, borderRadius: 12, lineHeight: 21 }, link: { color: '#245B4B', fontWeight: '700', lineHeight: 21 },
});
