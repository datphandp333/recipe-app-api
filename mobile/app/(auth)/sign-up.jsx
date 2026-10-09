import { useSignUp } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AuthFrame,{AuthButton,AuthMessage,ui} from '../../components/auth/AuthFrame';
import SocialButtons from '../../components/auth/SocialButtons';
import useAuthAction from '../../components/auth/useAuthAction';
import { authError } from '../../services/authFlow';
export default function SignUpScreen() {
 const {signUp,fetchStatus}=useSignUp();const router=useRouter();
 const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [code,setCode]=useState('');
 const [showPassword,setShowPassword]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');
 const {busy,run}=useAuthAction();const loading=busy||fetchStatus==='fetching';
 const verifying=signUp.status==='missing_requirements'&&signUp.unverifiedFields?.includes('email_address');
 async function finalize(){
   const result=await signUp.finalize({navigate:({session})=>router.replace(session?.currentTask?'/account-tasks':'/')});
   if(result.error)throw result.error;
 }
 async function sendCode(){const result=await signUp.verifications.sendEmailCode();if(result.error)throw result.error;setNotice('A verification code has been sent to your email.');}
 async function submit(){
  setError('');setNotice('');
  try{
   if(!email.trim()||!password)throw new Error('Enter your email address and a password.');
   const result=await signUp.password({emailAddress:email.trim(),password});if(result.error)throw result.error;
   setPassword('');
   if(signUp.status==='complete')await finalize();
   else if(signUp.missingFields?.length)router.push({pathname:'/(auth)/complete-account',params:{mode:'signUp'}});
   else if(signUp.unverifiedFields?.includes('email_address'))await sendCode();
   else router.push({pathname:'/(auth)/complete-account',params:{mode:'signUp'}});
  }catch(failure){setError(authError(failure));}
 }
 async function verify(){
  setError('');setNotice('');
  try{const result=await signUp.verifications.verifyEmailCode({code:code.trim()});if(result.error)throw result.error;
   if(signUp.status==='complete')await finalize();else router.push({pathname:'/(auth)/complete-account',params:{mode:'signUp'}});
  }catch(failure){setError(authError(failure));}
 }
 return <AuthFrame><Text style={ui.title}>{verifying?'Check your email':'Make yourself at home'}</Text><Text style={ui.body}>{verifying?`Enter the verification code sent to ${email||signUp.emailAddress}.`:'Create your Simmerli account to save recipes and make more of your pantry.'}</Text>
 {!verifying&&<SocialButtons/>}<AuthMessage>{error}</AuthMessage>{!!notice&&<Text accessibilityLiveRegion="polite" style={ui.body}>{notice}</Text>}
 {verifying?<><Text style={ui.label}>Verification code</Text><TextInput accessibilityLabel="Verification code" style={ui.input} value={code} onChangeText={setCode} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" autoCapitalize="none" editable={!loading}/><AuthButton title={loading?'Verifying…':'Verify and continue'} disabled={loading||!code.trim()} onPress={()=>run(verify)}/><AuthButton secondary title="Send another code" disabled={loading} onPress={()=>run(async()=>{setError('');try{await sendCode();}catch(failure){setError(authError(failure));}})}/></>:<>
 <Text style={ui.label}>Email address</Text><TextInput accessibilityLabel="Email address" style={ui.input} placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" editable={!loading}/>
 <Text style={ui.label}>Password</Text><View><TextInput accessibilityLabel="Password" style={[ui.input,{paddingRight:56}]} placeholder="Create a password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} textContentType="newPassword" editable={!loading} onSubmitEditing={()=>run(submit)}/><Pressable accessibilityRole="button" accessibilityLabel={showPassword?'Hide password':'Show password'} onPress={()=>setShowPassword(!showPassword)} style={{position:'absolute',right:4,top:4,padding:12,minHeight:44,minWidth:44}}><Ionicons name={showPassword?'eye-off-outline':'eye-outline'} size={22} color="#66736D"/></Pressable></View>
 <AuthButton title={loading?'Creating your account…':'Create account'} disabled={loading||!email.trim()||!password} onPress={()=>run(submit)}/></>}
 <View nativeID="clerk-captcha"/>
 <AuthButton secondary title="Already have an account? Sign in" disabled={loading} onPress={()=>router.replace('/(auth)/sign-in')}/>
 </AuthFrame>;
}
