import { useClerk } from '@clerk/expo';
import { useEffect,useRef,useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AuthFrame,{AuthButton,AuthMessage} from './AuthFrame';
import { authError } from '../../services/authFlow';
export default function SSOCallback(){
 const clerk=useClerk();const router=useRouter();const started=useRef(false);const [error,setError]=useState('');
 useEffect(()=>{if(!clerk.loaded||started.current)return;started.current=true;
 clerk.handleRedirectCallback({signInUrl:'/complete-account',signUpUrl:'/complete-account',continueSignUpUrl:'/complete-account',firstFactorUrl:'/complete-account',secondFactorUrl:'/complete-account',resetPasswordUrl:'/complete-account',verifyEmailAddressUrl:'/complete-account',verifyPhoneNumberUrl:'/complete-account',signInProtectCheckUrl:'/complete-account',signUpProtectCheckUrl:'/complete-account',signInFallbackRedirectUrl:'/',signUpFallbackRedirectUrl:'/'}).catch(failure=>setError(authError(failure)));
 },[clerk,clerk.loaded]);
 return <AuthFrame>{error?<><AuthMessage>{error}</AuthMessage><AuthButton title="Back to sign in" onPress={()=>router.replace('/(auth)/welcome')}/></>:<ActivityIndicator accessibilityLabel="Completing sign-in" color="#245B4B"/>}</AuthFrame>;
}
