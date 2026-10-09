import { Text, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import AuthFrame, { AuthButton, ui } from '../../components/auth/AuthFrame';
import SocialButtons from '../../components/auth/SocialButtons';
export default function Welcome() {
  const router = useRouter();
  return <AuthFrame>
    <Text style={ui.title}>Good meals begin{ '\n' }with what you have.</Text>
    <Text style={ui.body}>Discover a dish. Stock your pantry. Find your inspiration with Chef.</Text>
    <Image source={require('../../assets/images/curated/curated-vegetable-paella.jpg')} contentFit="cover" accessibilityLabel="Freshly prepared vegetable paella" style={styles.image} />
    <SocialButtons />
    <View style={styles.divider}><View style={styles.line}/><Text style={styles.or}>Make yourself at home</Text><View style={styles.line}/></View>
    <AuthButton title="Sign up with email" onPress={() => router.push('/(auth)/sign-up')} />
    <AuthButton secondary title="Already have an account? Sign in" onPress={() => router.push('/(auth)/sign-in')} />
    <Text style={styles.footer}>Your recipes, pantry, and favorites—all together.</Text>
  </AuthFrame>;
}
const styles = StyleSheet.create({image:{width:'100%',height:180,borderRadius:18,marginBottom:24},divider:{flexDirection:'row',alignItems:'center',gap:12,marginVertical:16},line:{height:1,backgroundColor:'#E7EBE8',flex:1},or:{fontSize:12,color:'#66736D'},footer:{textAlign:'center',fontSize:12,lineHeight:18,color:'#66736D',marginTop:12}});
