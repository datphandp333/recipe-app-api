import { useState } from "react";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { ingredientImageUrls, ingredientIllustration } from "../services/ingredientImages";

function Picture({ uri, backup, name }) {
  const [failed, setFailed] = useState([]);
  const source = [uri, backup].find(url => url && !failed.includes(url));
  return source ? <Image source={{ uri: source }} contentFit="contain" style={styles.image}
    accessibilityLabel={`Ingredient: ${name}`} onError={() => setFailed(previous => [...previous, source])} />
    : <View style={styles.fallback}><Text style={styles.initial}>{name.trim().slice(0, 1).toUpperCase()}</Text><Text style={styles.caption}>No photo</Text></View>;
}
export default function IngredientPicture({ ingredient, style }) {
  const name = typeof ingredient === 'string' ? ingredient : ingredient?.name || ingredient?.label || 'Ingredient';
  const illustration = ingredientIllustration(ingredient);
  if (illustration) return <View style={[styles.container, style]} accessible accessibilityLabel={`${name} illustration`}>
    {illustration === 'nori' ? <View style={{ width: '65%', height: '65%', backgroundColor: '#364B2B', borderColor: '#637547', borderWidth: 3, borderRadius: 2, transform: [{ rotate: '-8deg' }] }}>
      {[0, 1, 2].map(i => <View key={i} style={{ height: 2, backgroundColor: '#53643F', marginTop: 8, marginHorizontal: 5 }} />)}
    </View> : <View style={{ width: '75%', height: '65%', backgroundColor: '#ECD3A3', borderRadius: 100, borderWidth: 3, borderColor: '#D5B581', transform: [{ rotate: '-8deg' }] }}>
      <View style={{ width: '60%', height: '45%', borderRadius: 80, backgroundColor: '#F7E5C5', margin: '8%' }} />
    </View>}
  </View>;
  const { explicit, urls } = ingredientImageUrls(ingredient);
  const sources = explicit ? [explicit] : urls.length ? urls : [null];
  return <View style={[styles.container, style]}>{sources.map((uri, index) =>
    <Picture key={`${name}:${uri}:${index}`} uri={uri} backup={explicit ? urls[0] : null} name={name} />
  )}</View>;
}
const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#FFF8F0', borderRadius: 12 },
  image: { flex: 1, height: '100%', minWidth: 0 },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#245B4B', fontWeight: '700', fontSize: 24 },
  caption: { color: '#65736B', fontSize: 9 },
});
