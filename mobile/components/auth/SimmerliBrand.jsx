import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// Scalable interpretation of the selected steam-S and bowl concept.
export default function SimmerliBrand({ compact = false }) {
  return <View accessible accessibilityLabel="Simmerli" style={styles.brand}>
    <SimmerliMark size={compact ? 42 : 66} />
    <Text style={[styles.name, compact && { fontSize: 25 }]}>Simmerli</Text>
  </View>;
}
export function SimmerliMark({ size = 66 }) {
  return (
    <Svg width={size} height={size * 1.16} viewBox="0 0 100 116" accessible={false}>
      <Path fill="#B6C5A5" d="M64 2C39 14 36 28 60 40C71 46 74 51 73 59C87 39 62 33 59 23C57 16 60 8 64 2Z" />
      <Path fill="#245B4B" d="M43 19C12 36 14 53 42 66C64 76 65 81 48 89C86 85 92 65 63 51C35 38 31 34 43 19Z" />
      <Path fill="#B6C5A5" d="M26 57C7 77 34 80 38 91C50 76 21 77 26 57Z" />
      <Path fill="#245B4B" d="M8 94H92C88 104 75 112 62 112H38C25 112 12 104 8 94Z" />
    </Svg>
  );
}
const styles = StyleSheet.create({brand: {flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24}, name: {fontSize: 34, fontWeight: '700', color: '#245B4B', letterSpacing: -1}});
