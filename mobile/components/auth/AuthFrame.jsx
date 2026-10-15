import Pressable from "../motion/MotionPressable";
import { KeyboardAvoidingView, Platform, ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SimmerliBrand from './SimmerliBrand';
export default function AuthFrame({ children }) {
  return <SafeAreaView style={ui.page}><KeyboardAvoidingView style={ui.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.content}><SimmerliBrand compact />{children}</ScrollView>
  </KeyboardAvoidingView></SafeAreaView>;
}
export function AuthButton({ title, onPress, disabled, secondary = false }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} style={[ui.button, secondary && ui.secondary, disabled && {opacity: 0.5}]}><Text style={[ui.buttonText, secondary && {color: '#245B4B'}]}>{title}</Text></Pressable>;
}
export function AuthMessage({ children }) { return children ? <View accessibilityRole="alert" style={ui.error}><Text style={{color:'#923C2A', lineHeight:22}}>{children}</Text></View> : null; }
export const ui = StyleSheet.create({page:{flex:1, backgroundColor:'#FFFFFF'}, content:{flexGrow:1, width:'100%', maxWidth:480, alignSelf:'center', padding:24, paddingBottom:40}, title:{fontSize:30,fontWeight:'700',color:'#17231F',letterSpacing:-0.7,marginBottom:10}, body:{fontSize:16,lineHeight:24,color:'#66736D',marginBottom:24}, button:{minHeight:52,justifyContent:'center',alignItems:'center',padding:14,backgroundColor:'#245B4B',borderRadius:14,marginBottom:12},buttonText:{fontWeight:'600',fontSize:16,color:'#FFFFFF',textAlign:'center'},secondary:{backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#DDE2DF'},error:{backgroundColor:'#FFF0EB',padding:14,borderRadius:12,marginBottom:16}, label:{fontSize:14,fontWeight:'600',color:'#20302A',marginBottom:8}, input:{fontSize:16,color:'#20302A',borderWidth:1,borderColor:'#DDE2DF',borderRadius:12,padding:16,minHeight:52,marginBottom:18}});
