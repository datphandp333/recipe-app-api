import { Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
export default function ProviderButton({ provider, onPress, disabled }) {
  const apple = provider === 'apple';
  return <Pressable accessibilityRole="button" accessibilityLabel={`Continue with ${apple ? 'Apple' : 'Google'}`} accessibilityState={{disabled:!!disabled}} disabled={disabled} onPress={onPress} style={[styles.button,apple && styles.apple,disabled && {opacity:0.5}]}>
    {apple ? <Ionicons name="logo-apple" size={22} color="white" /> : <Svg width={20} height={20} viewBox="0 0 48 48" accessible={false}>
      <Path fill="#4285F4" d="M43.61 24.46c0-1.36-.12-2.66-.35-3.92H24v7.42h11a9.4 9.4 0 0 1-4.08 6.17v5h6.61c3.87-3.56 6.08-8.8 6.08-14.67Z"/>
      <Path fill="#34A853" d="M24 44c5.5 0 10.11-1.82 13.48-4.87l-6.61-5c-1.82 1.22-4.14 1.95-6.87 1.95-5.31 0-9.8-3.59-11.41-8.42H5.76v5.16A20.35 20.35 0 0 0 24 44Z"/>
      <Path fill="#FBBC05" d="M12.59 27.66a12.1 12.1 0 0 1 0-7.32v-5.16H5.76a20 20 0 0 0 0 17.64l6.83-5.16Z"/>
      <Path fill="#EA4335" d="M24 11.92c3 0 5.68 1.03 7.8 3.05l5.85-5.85C34.1 5.81 29.5 4 24 4A20.35 20.35 0 0 0 5.76 15.18l6.83 5.16C14.2 15.51 18.69 11.92 24 11.92Z"/>
    </Svg>}
    <Text style={[styles.text,apple && {color:'white'}]}>Continue with {apple ? 'Apple' : 'Google'}</Text>
  </Pressable>;
}
const styles=StyleSheet.create({button:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:12,minHeight:52,borderRadius:12,borderWidth:1,borderColor:'#747775',backgroundColor:'white',padding:12,marginBottom:12},apple:{backgroundColor:'#000',borderColor:'#000'},text:{fontSize:16,fontWeight:'500',color:'#1F1F1F'}});
