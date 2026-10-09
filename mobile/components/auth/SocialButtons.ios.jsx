import { useClerk } from '@clerk/expo';
import { useSignInWithApple } from '@clerk/expo/apple';
import { useSignInWithGoogle } from '@clerk/expo/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import { requireOptionalNativeModule } from 'expo';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import ProviderButton from './ProviderButton';
import { AuthMessage } from './AuthFrame';
import { authError, socialOutcome } from '../../services/authFlow';
export default function SocialButtons() {
  const { loaded, client } = useClerk();
  const router = useRouter();
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const { startGoogleAuthenticationFlow } = useSignInWithGoogle();
  const [appleAvailable,setAppleAvailable]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const lock=useRef(false);
  const alive=useRef(true);
  const settings=Constants.expoConfig?.extra || {};
  const nativeBuild=Constants.executionEnvironment !== 'storeClient';
  const googleConfigured=!!(settings.EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID && settings.EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID && settings.EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME);
  const googleModuleAvailable=!!requireOptionalNativeModule('ClerkGoogleSignIn');
  const googleAvailable=nativeBuild && settings.googleSignInEnabled && googleConfigured && googleModuleAvailable;
  const googleSetupMessage=!nativeBuild
    ? 'Google sign-in requires the Simmerli development build. Open Simmerli instead of Expo Go.'
    : !settings.googleSignInEnabled
      ? 'Google sign-in is disabled in this running configuration. Restart Metro after enabling it in mobile/.env.'
      : !googleConfigured
        ? 'Google sign-in configuration is missing in this running app. Restart Metro after adding the Google client IDs and iOS URL scheme.'
        : !googleModuleAvailable
          ? 'This installed build does not include Google sign-in. Rebuild and install Simmerli with npx expo run:ios --device.'
          : '';

  useEffect(()=>{alive.current=true; AppleAuthentication.isAvailableAsync().then(value=>{if(alive.current)setAppleAvailable(value);}).catch(()=>{}); return ()=>{alive.current=false;};},[]);
  const appleEnabled=nativeBuild && settings.appleSignInEnabled && appleAvailable;
  const start=async provider=>{
    if(lock.current || !loaded) return;
    lock.current=true;setBusy(true);setError('');
    // Canceled native hooks may return resources left over from a prior attempt.
    const before=JSON.stringify([client?.signIn?.id,client?.signIn?.status,client?.signIn?.updatedAt,client?.signUp?.id,client?.signUp?.status,client?.signUp?.updatedAt]);
    try {
      const result=await (provider==='apple'?startAppleAuthenticationFlow():startGoogleAuthenticationFlow());
      const outcome=socialOutcome(result);
      if(outcome==='complete') await result.setActive({session:result.createdSessionId});
      else if(outcome==='requirements') {
        const after=JSON.stringify([result.signIn?.id,result.signIn?.status,result.signIn?.updatedAt,result.signUp?.id,result.signUp?.status,result.signUp?.updatedAt]);
        if(before!==after && alive.current) router.push({pathname:'/(auth)/complete-account',params:{mode:result.signUp?.status==='missing_requirements'?'signUp':'signIn'}});
      }
    } catch(failure) {if(alive.current)setError(authError(failure));}
    finally{lock.current=false;if(alive.current)setBusy(false);}
  };
  if(!appleEnabled && !googleAvailable && !__DEV__) return null;
  return <View>
    {__DEV__ && !googleAvailable && <AuthMessage>{googleSetupMessage}</AuthMessage>}
    {appleEnabled && <View pointerEvents={busy?'none':'auto'} accessibilityState={{disabled:busy}} style={busy?{opacity:0.5}:undefined}><AppleAuthentication.AppleAuthenticationButton buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE} buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK} cornerRadius={12} style={{width:'100%',height:52,marginBottom:12}} onPress={()=>start('apple')} /></View>}
    {googleAvailable && <ProviderButton provider="google" disabled={busy||!loaded} onPress={()=>start('google')} />}
    {busy && <ActivityIndicator accessibilityLabel="Signing in" color="#245B4B" style={{marginBottom:12}}/>}<AuthMessage>{error}</AuthMessage>
  </View>;
}
